"use client";

import { ArrowRight, EnvelopeSimple, Gift, Link as LinkIcon } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { currencies, currencyOptions, parseEmails } from "./CreateSessionForm";
import { Select } from "./Select";
import { WizardHeader } from "./WizardHeader";
import { useRouter } from "@/i18n/navigation";
import { createSessionAction } from "@/lib/actions";

const TOTAL = 4;
type Currency = (typeof currencies)[number];

/** Setting up a fully remote draw one question at a time: the game, the budget, the guests, the chief's e-mail. */
export function RemoteWizard() {
  const t = useTranslations("remote");
  const tc = useTranslations("create");
  const th = useTranslations("host");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState<Currency>(locale === "pl" ? "PLN" : locale === "en" ? "GBP" : "EUR");
  const [hostPlays, setHostPlays] = useState(true);
  const [invites, setInvites] = useState("");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inviteList = parseEmails(invites);
  const back = step > 1 ? () => setStep(step - 1) : undefined;

  const create = () =>
    start(async () => {
      setError(null);
      const amount = Number(budget.replace(",", "."));
      const result = await createSessionAction({
        title: title.trim() || tc("titlePlaceholder"),
        mode: "async",
        locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduledAt: null,
        location: null,
        onlineUrl: null,
        budgetAmount: amount > 0 ? amount : null,
        currency,
        hostName: hostName.trim(),
        hostEmail: email.trim(),
        invites: inviteList,
        autoAdmit: true,
        hostPlays,
      });
      if (result.ok) router.push(`/s/${result.code}/host`);
      else setError(te.has(result.error) ? te(result.error) : te("unknown"));
    });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < TOTAL) setStep(step + 1);
    else create();
  };

  return (
    <form onSubmit={next} className="card p-6 md:p-8">
      {step === 1 && (
        <>
          <WizardHeader step={1} total={TOTAL} title={t("nameTitle")} />
          <label className="label" htmlFor="rw-title">{tc("title")}</label>
          <input id="rw-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={tc("titlePlaceholder")} className="field" autoFocus />
          <label className="label mt-5" htmlFor="rw-host">{t("hostName")}</label>
          <input id="rw-host" value={hostName} onChange={(e) => setHostName(e.target.value)} required maxLength={40} className="field" autoComplete="given-name" />
        </>
      )}

      {step === 2 && (
        <>
          <WizardHeader step={2} total={TOTAL} title={t("budgetTitle")} onBack={back} />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="label" htmlFor="rw-budget">{tc("budget")}</label>
              <input id="rw-budget" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder={tc("budgetPlaceholder")} className="field" autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="rw-currency">{tc("currency")}</label>
              <Select id="rw-currency" name="currency" value={currency} onChange={(v) => setCurrency(v as Currency)} options={currencyOptions} className="field min-w-36" />
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">{t("budgetHint")}</p>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper p-4">
            <input type="checkbox" checked={hostPlays} onChange={(e) => setHostPlays(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-pine" />
            <span>
              <span className="block font-semibold">{th("hostPlays")}</span>
              <span className="mt-0.5 block text-sm text-muted">{th("hostPlaysHint")}</span>
            </span>
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <WizardHeader step={3} total={TOTAL} title={t("invitesTitle")} onBack={back} />
          <p className="text-muted">{t("invitesHint")}</p>
          <label className="label mt-5" htmlFor="rw-invites">{t("invitesLabel")}</label>
          <textarea
            id="rw-invites"
            value={invites}
            onChange={(e) => setInvites(e.target.value)}
            rows={4}
            placeholder="ola@example.com, tom@example.com"
            className="field resize-y"
            autoFocus
          />
          {inviteList.length > 0 && <p className="mt-2 text-sm font-semibold text-pine">{tc("invitesCount", { count: inviteList.length })}</p>}
        </>
      )}

      {step === 4 && (
        <>
          <WizardHeader step={4} total={TOTAL} title={t("emailTitle")} onBack={back} />
          <label className="label" htmlFor="rw-email">{tc("hostEmail")}</label>
          <input id="rw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" autoComplete="email" autoFocus />
          <p className="mt-2 text-sm text-muted">{t("emailHint")}</p>
          <ol className="mt-6 space-y-3 rounded-2xl bg-paper p-5">
            {[
              { Icon: LinkIcon, text: t("how1") },
              { Icon: Gift, text: t("how2") },
              { Icon: EnvelopeSimple, text: t("how3") },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <Icon weight="bold" className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
                {text}
              </li>
            ))}
          </ol>
        </>
      )}

      {error && <p className="mt-5 rounded-2xl bg-berry/10 px-4 py-3 text-berry" role="alert">{error}</p>}

      <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
        {(step === 2 || step === 3) && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (step === 2) setBudget("");
              else setInvites("");
              setStep(step + 1);
            }}
          >
            {t("skip")}
          </button>
        )}
        <button className="btn-primary" disabled={pending}>
          {step < TOTAL ? th("continue") : pending ? tc("creating") : t("open")}
          {step < TOTAL && <ArrowRight weight="bold" className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
