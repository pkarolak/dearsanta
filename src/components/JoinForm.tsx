"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { joinSessionAction } from "@/lib/actions";

export function JoinForm({ code, defaultEmail, emailOptional = false }: { code: string; defaultEmail?: string; emailOptional?: boolean }) {
  const t = useTranslations("join");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  if (checkEmail) {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-2xl font-bold">{t("checkEmailTitle")}</p>
        <p className="mt-2 text-muted">{t("checkEmailBody")}</p>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4 p-6"
      action={(form) => {
        setError(null);
        start(async () => {
          const result = await joinSessionAction({
            code,
            name: String(form.get("name")),
            email: String(form.get("email")),
            locale,
          });
          if (!result.ok) setError(te.has(result.error) ? te(result.error) : te("unknown"));
          else if (result.next === "check_email") setCheckEmail(true);
          else router.push(`/s/${code}/me`);
        });
      }}
    >
      <div>
        <label className="label" htmlFor="name">{t("name")}</label>
        <input id="name" name="name" required maxLength={40} className="field text-lg" autoComplete="given-name" autoFocus={emailOptional} />
      </div>
      <div>
        <label className="label" htmlFor="email">{emailOptional ? t("emailOptional") : t("email")}</label>
        <input id="email" name="email" type="email" required={!emailOptional} defaultValue={defaultEmail} className="field text-lg" autoComplete="email" />
        <p className="mt-1.5 text-xs text-muted">{emailOptional ? t("emailHintOptional") : t("emailHint")}</p>
      </div>
      {error && <p className="text-sm text-berry" role="alert">{error}</p>}
      <button className="btn-primary w-full text-lg" disabled={pending}>
        {pending ? t("joining") : t("submit")}
      </button>
    </form>
  );
}
