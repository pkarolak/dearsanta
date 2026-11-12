"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { ShowFrame, ShowStage } from "./show/ShowStage";
import { useVoice } from "./useVoice";
import type { SessionState } from "@/lib/state";

type Props = {
  state: SessionState;
  locale: string;
  audible: boolean;
  serverToLocal: (ms: number) => number;
  joinUrl?: string;
  compact?: boolean;
  className?: string;
  /** Controls in the top-right corner of the show, e.g. the host's buttons on the big screen. */
  controls?: React.ReactNode;
};

/** Without Santa's voice to follow, the wheel spins this long before it slows down. */
const silentSpinMs = 8000;
/** The draw's lines: the wheel speeds up through the first two and slows to a stop on the third ("Done!"). */
const stopOnLine = 2;

/** Santa's show as every device sees it, all in his workshop. */
export function CeremonyStage({ state, locale, audible, serverToLocal, joinUrl, compact, className = "", controls }: Props) {
  const t = useTranslations("stage");
  const th = useTranslations("host");
  const step = state.session.step;
  const startedAt = state.session.stepStartedAt;
  const { current, index } = useVoice(state.script, `${step}@${startedAt}`, serverToLocal(startedAt), audible, locale);
  const [silentStop, setSilentStop] = useState<number | null>(null);
  useEffect(() => {
    if (step !== "draw") return;
    const left = silentSpinMs - (Date.now() - serverToLocal(startedAt));
    const timer = setTimeout(() => setSilentStop(startedAt), Math.max(0, left));
    return () => clearTimeout(timer);
  }, [step, startedAt, serverToLocal]);
  const voiced = audible && !!state.script?.length;
  const stopped = step !== "draw" || (voiced ? index >= stopOnLine : silentStop === startedAt);
  const elves = state.participants.filter((p) => p.status === "approved");
  const budget =
    state.session.budgetAmount !== null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: state.session.currency, maximumFractionDigits: 0 }).format(
          state.session.budgetAmount,
        )
      : null;

  let card: React.ReactNode = null;
  if (step === "lobby" && joinUrl) {
    card = (
      <div className="flex h-full items-center gap-[4cqw] p-[5cqw]">
        <QRCodeSVG value={joinUrl} className="aspect-square h-[84%] w-auto shrink-0" fgColor="#2b1810" bgColor="#fffdf8" level="M" marginSize={0} />
        <div className="min-w-0">
          <p className="font-display text-[6.6cqw] font-bold leading-[1.1] text-ink">{t("scanToJoin")}</p>
          <p className="mt-[2.5cqw] text-[4.4cqw] leading-tight text-muted">{t("orEnterCode")}</p>
          <p className="mt-[1.5cqw] font-display text-[7cqw] font-black leading-none text-berry">{state.session.code}</p>
        </div>
      </div>
    );
  } else if (step === "rules") {
    card = (
      <div className="flex h-full flex-col justify-center p-[6cqw] text-center">
        <p className="text-[6cqw] font-semibold text-muted">{t("budgetLabel")}</p>
        <p className="font-display text-[16cqw] font-black leading-none text-berry">{budget ?? t("noBudget")}</p>
        <p className="mt-[4cqw] font-display text-[6.5cqw] font-semibold leading-tight text-ink">{t("ruleSecret")}</p>
      </div>
    );
  }

  const progress = state.revealProgress;
  const stageText =
    step === "reveal"
      ? {
          title: t("lookAtDevice"),
          detail: progress && progress.total > 0 ? t("revealed", { revealed: progress.revealed, total: progress.total }) : undefined,
        }
      : step === "farewell"
        ? { title: t("merry") }
        : undefined;

  return (
    <ShowFrame className={className}>
      <ShowStage
        step={step}
        title={state.session.title}
        stepLabel={step === "lobby" ? t("elvesReady", { count: elves.length }) : t(`steps.${step}`)}
        elves={elves}
        talking={!!current}
        draw={stopped ? "stopped" : "spinning"}
        subtitle={current ? { id: current.id, text: current.text } : null}
        compact={compact}
        card={card}
        stageText={stageText}
        remoteLabel={th("remote")}
        controls={controls}
      />
    </ShowFrame>
  );
}
