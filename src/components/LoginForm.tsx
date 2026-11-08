"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { requestLoginLinkAction } from "@/lib/actions";

export function LoginForm() {
  const t = useTranslations("login");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  if (sent) {
    return (
      <div className="clay p-6 text-center">
        <p className="font-display text-2xl">{t("sentTitle")}</p>
        <p className="mt-2 text-muted">{t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form
      className="clay space-y-4 p-6"
      action={(form) =>
        start(async () => {
          const result = await requestLoginLinkAction({ email: String(form.get("email")), locale });
          if (result.ok) setSent(true);
          else setError(true);
        })
      }
    >
      <div>
        <label className="label" htmlFor="email">{t("email")}</label>
        <input id="email" name="email" type="email" required className="field text-lg" autoComplete="email" />
      </div>
      {error && <p className="text-sm text-berry">{t("error")}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {t("submit")}
      </button>
    </form>
  );
}
