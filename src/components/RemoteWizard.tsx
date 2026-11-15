"use client";

import {
  ArrowRight,
  Briefcase,
  Check,
  Copy,
  EnvelopeSimple,
  Gift,
  HouseLine,
  Link as LinkIcon,
  PaperPlaneTilt,
  ShareNetwork,
  Sparkle,
  Student,
  UsersThree,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { currencies, currencyOptions, parseEmails } from "./CreateSessionForm";
import { Select } from "./Select";
import { WizardHeader } from "./WizardHeader";
import { useRouter } from "@/i18n/navigation";
import { createSessionAction, inviteAction } from "@/lib/actions";

const TOTAL = 4;
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
 * Setting up a fully remote draw step by step: who it's for, the budget, the chief's own details, and finally
 * inviting the others. The party is created before the last step, so its link is real and can be copied there.
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
  const [email, setEmail] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostPlays, setHostPlays] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const back = step > 1 ? () => setStep(step - 1) : undefined;
  const fail = (key: string) => setError(te.has(key) ? te(key) : te("unknown"));

  const suggestion = (id: Context) => (id === "other" ? "" : t(`suggestions.${id}`, { year: new Date().getFullYear() }));
  const pickContext = (id: Context) => {
    if (!title || (context && title === suggestion(context))) setTitle(suggestion(id));
    setContext(id);
    if (id === "school") setHostPlays(false);
    else if (context === "school") setHostPlays(true);
  };

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
        invites: [],
        autoAdmit: true,
        hostPlays,
      });
      if (!result.ok) return fail(result.error);
      setCode(result.code);
      setStep(4);
    });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else create();
  };

  if (step === 4 && code) return <InviteStep code={code} onDone={() => router.push(`/s/${code}/host`)} />;

  return (
    <form onSubmit={next} className="card p-6 md:p-8">
      {step === 1 && (
        <>
          <WizardHeader step={1} total={TOTAL} title={t("contextTitle")} />
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
          <label className="label mt-6" htmlFor="rw-title">{t("nameLabel")}</label>
          <input id="rw-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={tc("titlePlaceholder")} className="field" />
          <p className="mt-2 text-sm text-muted">{t("nameHint")}</p>
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
        </>
      )}

      {step === 3 && (
        <>
          <WizardHeader step={3} total={TOTAL} title={t("coordTitle")} onBack={back} />
          <p className="-mt-2 mb-5 text-muted">{t("coordLead")}</p>
          <label className="label" htmlFor="rw-email">{tc("hostEmail")}</label>
          <input id="rw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" autoComplete="email" autoFocus />
          <p className="mt-2 text-sm text-muted">{t("emailHint")}</p>
          <label className="label mt-5" htmlFor="rw-host">{t("hostName")}</label>
          <input id="rw-host" value={hostName} onChange={(e) => setHostName(e.target.value)} required maxLength={40} className="field" autoComplete="given-name" />
          <p className="mt-2 text-sm text-muted">{t("hostNameHint", { name: hostName.trim() || tc("quick.hostName") })}</p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper p-4">
            <input type="checkbox" checked={hostPlays} onChange={(e) => setHostPlays(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-pine" />
            <span>
              <span className="block font-semibold">{th("hostPlays")}</span>
              <span className="mt-0.5 block text-sm text-muted">{th("hostPlaysHint")}</span>
            </span>
          </label>
          <ol className="mt-6 space-y-3 rounded-2xl bg-paper/60 p-5 ring-1 ring-ink/5">
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
        {step === 2 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setBudget("");
              setStep(3);
            }}
          >
            {t("skip")}
          </button>
        )}
        <button className="btn-primary" disabled={pending}>
          {step < 3 ? th("continue") : pending ? tc("creating") : t("create")}
          {!pending && <ArrowRight weight="bold" className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}

/** The party exists now: share its link, or send e-mail invitations with a personal note. */
function InviteStep({ code, onDone }: { code: string; onDone: () => void }) {
  const t = useTranslations("remote");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [emails, setEmails] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = parseEmails(emails);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/${locale}/join/${code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = () => void navigator.share({ url: link }).catch(() => {});

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!list.length) return;
    start(async () => {
      setError(null);
      const result = await inviteAction(code, list, note);
      if (!result.ok) return setError(te.has(result.error) ? te(result.error) : te("unknown"));
      setSent((n) => n + result.sent);
      setEmails("");
    });
  };

  return (
    <section className="card p-6 md:p-8">
      <WizardHeader step={TOTAL} total={TOTAL} title={t("inviteTitle")} />
      <p className="-mt-2 text-muted">{t("inviteLead")}</p>

      <label className="label mt-6" htmlFor="rw-link">{t("linkLabel")}</label>
      <div className="flex flex-wrap gap-2">
        <input id="rw-link" readOnly value={link} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 basis-60 font-mono text-sm" />
        <button type="button" className="btn-soft" onClick={copy}>
          {copied ? <Check weight="bold" className="h-4 w-4" /> : <Copy weight="bold" className="h-4 w-4" />}
          {copied ? t("copied") : t("copy")}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" className="btn-soft" onClick={share}>
            <ShareNetwork weight="bold" className="h-4 w-4" />
            {t("share")}
          </button>
        )}
      </div>

      <form onSubmit={send} className="mt-7 border-t border-ink/10 pt-6">
        <label className="label" htmlFor="rw-invites">{t("emailsLabel")}</label>
        <textarea
          id="rw-invites"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={3}
          placeholder="ola@example.com, tom@example.com"
          className="field resize-y"
        />
        <label className="label mt-4" htmlFor="rw-note">{t("noteLabel")}</label>
        <textarea id="rw-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder={t("notePlaceholder")} className="field resize-y" />
        {error && <p className="mt-4 rounded-2xl bg-berry/10 px-4 py-3 text-berry" role="alert">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-pine" disabled={pending || !list.length}>
            <PaperPlaneTilt weight="bold" className="h-4 w-4" />
            {list.length ? t("sendCount", { count: list.length }) : t("send")}
          </button>
          {sent > 0 && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-pine" role="status">
              <Check weight="bold" className="h-4 w-4" />
              {t("sent", { count: sent })}
            </p>
          )}
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6">
        <p className="text-sm text-muted">{t("later")}</p>
        <button type="button" className="btn-primary" onClick={onDone}>
          {t("toPanel")}
          <ArrowRight weight="bold" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
