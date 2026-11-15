"use client";

import { ArrowRight, Briefcase, EnvelopeSimple, Gift, HouseLine, Link as LinkIcon, Sparkle, Student, UsersThree } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { currencies, currencyOptions, parseEmails } from "./CreateSessionForm";
import { Select } from "./Select";
import { WizardHeader } from "./WizardHeader";
import { useRouter } from "@/i18n/navigation";
import { createSessionAction } from "@/lib/actions";

const TOTAL = 5;
type Currency = (typeof currencies)[number];

const contexts = [
  { id: "family", Icon: HouseLine },
  { id: "friends", Icon: UsersThree },
  { id: "work", Icon: Briefcase },
  { id: "school", Icon: Student },
  { id: "other", Icon: Sparkle },
] as const;
type Context = (typeof contexts)[number]["id"];

/**
 * Setting up a fully remote draw one question at a time: who it's for, its name, the budget, the guests and
 * the chief's e-mail. Only the party is set up here; the chief's own name and elf come later, in the panel.
 */
export function RemoteWizard() {
  const t = useTranslations("remote");
  const tc = useTranslations("create");
  const th = useTranslations("host");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<Context | null>(null);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState<Currency>(locale === "pl" ? "PLN" : locale === "en" ? "GBP" : "EUR");
  const [hostPlays, setHostPlays] = useState(true);
  const [invites, setInvites] = useState("");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inviteList = parseEmails(invites);
  const back = step > 1 ? () => setStep(step - 1) : undefined;

  const pickContext = (id: Context) => {
    if (!title || (context && title === suggestion(context))) setTitle(suggestion(id));
    setContext(id);
    if (id === "school") setHostPlays(false);
    else if (context === "school") setHostPlays(true);
    setStep(2);
  };
  const suggestion = (id: Context) => (id === "other" ? "" : t(`suggestions.${id}`, { year: new Date().getFullYear() }));

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
        hostName: tc("quick.hostName"),
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
          <WizardHeader step={1} total={TOTAL} title={t("contextTitle")} />
          <p className="-mt-2 mb-5 text-muted">{t("contextLead")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {contexts.map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={context === id}
                onClick={() => pickContext(id)}
                className={`flex items-center gap-3 rounded-2xl p-4 text-left font-semibold transition ${
                  context === id ? "bg-paper ring-2 ring-berry" : "bg-paper/70 ring-1 ring-ink/10 hover:bg-paper hover:ring-ink/25"
                } ${id === "other" ? "sm:col-span-2" : ""}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-berry/10 text-berry">
                  <Icon weight="bold" className="h-5 w-5" />
                </span>
                {t(`contexts.${id}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <WizardHeader step={2} total={TOTAL} title={t("nameTitle")} onBack={back} />
          <label className="label" htmlFor="rw-title">{tc("title")}</label>
          <input id="rw-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={tc("titlePlaceholder")} className="field" autoFocus />
          <p className="mt-2 text-sm text-muted">{t("nameHint")}</p>
        </>
      )}

      {step === 3 && (
        <>
          <WizardHeader step={3} total={TOTAL} title={t("budgetTitle")} onBack={back} />
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

      {step === 4 && (
        <>
          <WizardHeader step={4} total={TOTAL} title={t("invitesTitle")} onBack={back} />
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

      {step === 5 && (
        <>
          <WizardHeader step={5} total={TOTAL} title={t("emailTitle")} onBack={back} />
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
        {(step === 3 || step === 4) && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (step === 3) setBudget("");
              else setInvites("");
              setStep(step + 1);
            }}
          >
            {t("skip")}
          </button>
        )}
        <button className={`btn-primary ${step === 1 && !context ? "hidden" : ""}`} disabled={pending}>
          {step < TOTAL ? th("continue") : pending ? tc("creating") : t("open")}
          {step < TOTAL && <ArrowRight weight="bold" className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
