"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function JoinCodeForm() {
  const t = useTranslations("home");
  const router = useRouter();
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  return (
    <form
      className="flex w-full max-w-sm items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length === 6) router.push(`/join/${clean}`);
      }}
    >
      <input
        value={clean}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("codePlaceholder")}
        aria-label={t("codePlaceholder")}
        className="field font-mono text-lg uppercase tracking-[0.3em]"
        autoCapitalize="characters"
        autoComplete="off"
        inputMode="text"
      />
      <button className="btn-pine shrink-0" disabled={clean.length !== 6}>
        {t("join")}
      </button>
    </form>
  );
}
