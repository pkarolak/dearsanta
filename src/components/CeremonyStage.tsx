"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FestiveLinks } from "./FestiveLinks";
import { BudgetBoard, JoinBoard } from "./show/BoardCards";
import { ShowFrame, ShowStage } from "./show/ShowStage";
import { useVoice } from "./useVoice";
import { chapterSeconds } from "@/lib/audio/timing";
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
  /** Santa's subtitles under the picture instead of over it, so a small phone screen keeps the whole stage. */
  captionsBelow?: boolean;
};

/** Without Santa's voice to follow, the wheel spins this long before it slows down. */
const silentSpinMs = 8000;
/** The draw's lines: the wheel speeds up through the first two and slows to a stop on the third ("Done!"). */
const stopOnLine = 2;

/** Santa's show as every device sees it, all in his workshop. */
export function CeremonyStage({ state, locale, audible, serverToLocal, joinUrl, compact, className = "", controls, captionsBelow }: Props) {
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
  // A device without Santa's voice closes the curtain when his goodbye would have ended.
  const goodbyeMs = (state.script ? chapterSeconds(state.script) : 0) * 1000 + 800;
  const [silentClose, setSilentClose] = useState<number | null>(null);
  useEffect(() => {
    if (step !== "farewell") return;
    const timer = setTimeout(() => setSilentClose(startedAt), Math.max(0, goodbyeMs - (Date.now() - serverToLocal(startedAt))));
    return () => clearTimeout(timer);
  }, [step, startedAt, serverToLocal, goodbyeMs]);
  const closed = step === "farewell" && (voiced ? index >= state.script!.length : silentClose === startedAt);
  const stopped = step !== "draw" || (voiced ? index >= stopOnLine : silentStop === startedAt);
  const elves = state.participants.filter((p) => p.status === "approved" && p.plays);
  const budget =
    state.session.budgetAmount !== null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: state.session.currency, maximumFractionDigits: 0 }).format(
          state.session.budgetAmount,
        )
      : null;

  let card: React.ReactNode = null;
  if ((step === "lobby" || step === "welcome") && joinUrl) {
    card = <JoinBoard url={joinUrl} code={state.session.code} title={t("scanToJoin")} hint={t("orEnterCode")} />;
  } else if (step === "rules") {
    card = <BudgetBoard label={t("budgetLabel")} budget={budget ?? t("noBudget")} note={t("ruleSecret")} />;
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

  const show = (frameClass: string) => (
    <ShowFrame className={frameClass}>
      <ShowStage
        step={step}
        title={state.session.title}
        stepLabel={step === "lobby" ? t("elvesReady", { count: elves.length }) : undefined}
        elves={elves}
        talking={!!current}
        draw={stopped ? "stopped" : "spinning"}
        subtitle={!captionsBelow && current ? { id: current.id, text: current.text } : null}
        compact={compact}
        card={card}
        stageText={stageText}
        remoteLabel={th("remote")}
        controls={controls}
        closed={closed}
        farewellExtras={compact ? undefined : <FestiveLinks variant="stage" />}
      />
    </ShowFrame>
  );

  if (!captionsBelow) return show(className);
  return (
    <div className={`flex flex-col ${className}`}>
      {show("aspect-video w-full")}
      <div className="flex min-h-[4.5rem] items-center justify-center bg-[#3b1217] px-4 py-2 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {current && (
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="font-display text-[0.95rem] font-semibold leading-snug text-snow"
            >
              {current.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
