"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

/** "Step 2 of 3" with a progress bar, a way back and the step's question. */
export function WizardHeader({ step, total, title, onBack }: { step: number; total: number; title: string; onBack?: () => void }) {
  const t = useTranslations("elf");
  return (
    <div className="mb-5">
      <div className="flex min-h-6 items-center justify-between text-sm font-semibold text-muted">
        {onBack ? (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 transition hover:text-ink">
            <ArrowLeft weight="bold" className="h-4 w-4" />
            {t("back")}
          </button>
        ) : (
          <span />
        )}
        <span>{t("stepOf", { step, total })}</span>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-berry" : "bg-ink/10"}`} />
        ))}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
    </div>
  );
}
