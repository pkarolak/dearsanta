"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { findSessionAction } from "@/lib/actions";

/** Takes the six-letter code, or a whole pasted invite link. */
function sessionCode(input: string) {
  const fromLink = input.match(/\/(?:join|s)\/([a-z0-9]{6})(?![a-z0-9])/i)?.[1];
  return (fromLink ?? input).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function JoinCodeForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const t = useTranslations("home");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="w-full max-w-sm"
      action={() =>
        start(async () => {
          const res = await findSessionAction(code);
          if (res.ok) router.push(res.path);
          else setError(true);
        })
      }
    >
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(sessionCode(e.target.value));
            setError(false);
          }}
          placeholder={t("codePlaceholder")}
          aria-label={t("codeLabel")}
          aria-invalid={error}
          aria-describedby={error ? "join-code-error" : undefined}
          className="field font-display text-lg font-bold uppercase tracking-[0.18em]"
          autoCapitalize="characters"
          autoComplete="off"
          autoFocus={autoFocus}
          inputMode="text"
        />
        <button className="btn-pine shrink-0" disabled={pending || code.length !== 6}>
          {t("join")}
        </button>
      </div>
      {error && (
        <p id="join-code-error" role="alert" className="mt-2 text-sm font-semibold text-berry">
          {t("codeNotFound")}
        </p>
      )}
    </form>
  );
}
