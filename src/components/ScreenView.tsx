"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { CeremonyStage } from "./CeremonyStage";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { advanceCeremonyAction, continueCeremonyAction, type ActionResult } from "@/lib/actions";
import { stepEnds } from "@/lib/ceremony/steps";
import type { SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";
import { useAutopilot, useSantaLeft } from "./useCeremonyFlow";

type Props = { code: string; screenKey: string | null; initial: SessionState; joinUrl: string };

export function ScreenView({ code, screenKey, initial, joinUrl }: Props) {
  const locale = useLocale();
  const t = useTranslations("host");
  const te = useTranslations("errors");
  const sound = useSoundGate();
  const { state, serverToLocal, refresh } = useSessionState(code, locale, { screenKey, initial, voice: sound.enabled });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { left: santaLeft, stuck } = useSantaLeft(state, serverToLocal);
  useAutopilot(code, state, santaLeft, refresh, screenKey);
  if (!state) return null;

  const step = state.session.step;
  const end = stepEnds[step];
  // A TV paired with its key may answer Santa too: whoever stands next to it.
  const canAnswer = (state.isHost || !!screenKey) && state.session.mode === "sync";
  const answer = canAnswer && santaLeft === 0 && (end === "answer" || end === "reveal" || (end === "auto" && stuck));
  const act = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) {
        const base = te.has(result.error) ? te(result.error) : te("unknown");
        setError(result.detail?.length ? `${base} ${result.detail.join(", ")}` : base);
      }
      await refresh();
    });

  const controls = (
    <div className="flex flex-col items-end gap-[0.6cqw]">
      <div className="flex items-center gap-[0.6cqw]">
        {sound.enabled && <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />}
        <button
          className="btn-soft px-4 py-2 text-sm"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
        >
          {t("fullscreen")}
        </button>
        {state.isHost && end === "start" && (
          <button className="btn-primary px-5 py-2" disabled={pending} onClick={() => act(() => advanceCeremonyAction(code))}>
            {t("start")}
          </button>
        )}
      </div>
      {error && <p className="max-w-sm rounded-2xl bg-berry px-4 py-2 text-sm text-snow">{error}</p>}
    </div>
  );

  return (
    <div className="relative">
      <CeremonyStage
        state={state}
        locale={locale}
        audible={sound.enabled}
        serverToLocal={serverToLocal}
        joinUrl={joinUrl}
        className="h-dvh w-full"
        controls={controls}
      />
      <AnimatePresence>
        {answer && (
          <motion.div
            key={`${step}@${state.session.stepStartedAt}`}
            className="pointer-events-none absolute inset-x-0 bottom-[7%] z-20 flex justify-center"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            <button
              className="btn-primary pointer-events-auto px-[2.6vw] py-[1.1vw] text-[clamp(1.1rem,2.1vw,2.4rem)] shadow-[0_20px_50px_-15px_rgb(0_0_0/0.7)]"
              disabled={pending}
              onClick={() => act(() => continueCeremonyAction(code, step, screenKey))}
            >
              {end === "answer" ? t(`answer.${step as "welcome" | "rules"}`) : t("continue")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {!sound.enabled && <SoundGateOverlay onEnable={sound.enable} />}
    </div>
  );
}
