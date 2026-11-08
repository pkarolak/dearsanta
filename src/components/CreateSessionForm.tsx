"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { createSessionAction } from "@/lib/actions";

export const currencies = ["PLN", "EUR", "USD", "GBP", "BRL", "CHF"] as const;

export function parseEmails(text: string) {
  return [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))];
}

export function CreateSessionForm() {
  const t = useTranslations("create");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sync" | "async">("sync");
  const [invites, setInvites] = useState("");
  const inviteList = parseEmails(invites);

  function submit(form: FormData) {
    setError(null);
    const date = String(form.get("date") ?? "");
    const time = String(form.get("time") ?? "") || "18:00";
    const budget = Number(String(form.get("budget") ?? "").replace(",", "."));
    start(async () => {
      const result = await createSessionAction({
        title: String(form.get("title")),
        mode,
        locale: String(form.get("sessionLocale") || locale),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        scheduledAt: date ? new Date(`${date}T${time}`).toISOString() : null,
        location: String(form.get("location") ?? "") || null,
        onlineUrl: String(form.get("onlineUrl") ?? "") || null,
        budgetAmount: budget > 0 ? budget : null,
        currency: String(form.get("currency")) as (typeof currencies)[number],
        hostName: String(form.get("hostName")),
        hostEmail: String(form.get("hostEmail")),
        invites: inviteList,
      });
      if (result.ok) router.push(`/s/${result.code}/host`);
      else setError(te.has(result.error) ? te(result.error) : te("unknown"));
    });
  }

  return (
    <form action={submit} className="space-y-8">
      <fieldset className="clay space-y-5 p-6 md:p-8">
        <legend className="sr-only">{t("you")}</legend>
        <h2 className="font-display text-2xl">{t("you")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="hostName">{t("hostName")}</label>
            <input id="hostName" name="hostName" required maxLength={40} className="field" autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="hostEmail">{t("hostEmail")}</label>
            <input id="hostEmail" name="hostEmail" type="email" required className="field" autoComplete="email" />
          </div>
        </div>
        <p className="text-sm text-muted">{t("hostHint")}</p>
      </fieldset>

      <fieldset className="clay space-y-5 p-6 md:p-8">
        <h2 className="font-display text-2xl">{t("session")}</h2>
        <div>
          <label className="label" htmlFor="title">{t("title")}</label>
          <input id="title" name="title" required maxLength={80} placeholder={t("titlePlaceholder")} className="field" />
        </div>

        <div>
          <span className="label">{t("mode")}</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["sync", "async"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-3xl p-5 text-left transition ${mode === m ? "clay ring-2 ring-berry" : "clay-sunk opacity-80 hover:opacity-100"}`}
              >
                <span className="block font-display text-xl">{t(`modes.${m}.title`)}</span>
                <span className="mt-1 block text-sm text-muted">{t(`modes.${m}.body`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="label" htmlFor="date">{t("date")}</label>
            <input id="date" name="date" type="date" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="time">{t("time")}</label>
            <input id="time" name="time" type="time" defaultValue="18:00" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="sessionLocale">{t("language")}</label>
            <select id="sessionLocale" name="sessionLocale" defaultValue={locale} className="field">
              {locales.map((l) => (
                <option key={l} value={l}>{localeNames[l]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="location">{t("location")}</label>
            <input id="location" name="location" maxLength={200} placeholder={t("locationPlaceholder")} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="onlineUrl">{t("onlineUrl")}</label>
            <input id="onlineUrl" name="onlineUrl" type="url" placeholder="https://meet.google.com/..." className="field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label" htmlFor="budget">{t("budget")}</label>
            <input id="budget" name="budget" inputMode="decimal" placeholder={t("budgetPlaceholder")} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="currency">{t("currency")}</label>
            <select id="currency" name="currency" defaultValue={locale === "pl" ? "PLN" : locale === "pt" ? "EUR" : locale === "en" ? "GBP" : "EUR"} className="field">
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="clay space-y-4 p-6 md:p-8">
        <h2 className="font-display text-2xl">{t("invites")}</h2>
        <p className="text-sm text-muted">{mode === "async" ? t("invitesHintAsync") : t("invitesHintSync")}</p>
        <textarea
          value={invites}
          onChange={(e) => setInvites(e.target.value)}
          rows={4}
          placeholder={"ola@example.com, tom@example.com"}
          className="field resize-y"
        />
        {inviteList.length > 0 && <p className="text-sm font-semibold text-pine">{t("invitesCount", { count: inviteList.length })}</p>}
      </fieldset>

      {error && <p className="rounded-2xl bg-berry/10 px-4 py-3 text-berry" role="alert">{error}</p>}

      <div className="flex justify-end">
        <button className="btn-primary text-lg" disabled={pending}>
          {pending ? t("creating") : t("submit")}
        </button>
      </div>
    </form>
  );
}
