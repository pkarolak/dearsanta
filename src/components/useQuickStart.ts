"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { quickStartAction } from "@/lib/actions";

export type QuickKind = "together" | "ownTime";

/** One click opens a ready workshop for the chosen way of celebrating and takes the Elf Chief to it. */
export function useQuickStart() {
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<QuickKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (kind: QuickKind) => {
    // A fully remote draw needs a few answers first (budget, invites, where to reach the chief).
    if (kind === "ownTime") return router.push("/new/remote");
    setChosen(kind);
    setError(null);
    start(async () => {
      const result = await quickStartAction({ kind, locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (result.ok) router.push(`/s/${result.code}/host`);
      else {
        setChosen(null);
        setError(te.has(result.error) ? te(result.error) : te("unknown"));
      }
    });
  };

  return { pick, pending, chosen, error };
}
