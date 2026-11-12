"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { useMouth, useVoice } from "./useVoice";
import { SantaPuppet } from "./show/SantaPuppet";
import { Confetti } from "./show/ShowStage";
import { Cast, Vignette } from "./show/Vignette";
import { Link } from "@/i18n/navigation";
import { markRevealedAction } from "@/lib/actions";
import type { AvatarConfig } from "@/lib/avatar";
import type { ScriptLine } from "@/lib/ceremony/script";

type Props = {
  code: string;
  title: string;
  receiver: { displayName: string; avatar: AvatarConfig };
  budget: string | null;
  script: { before: ScriptLine[]; after: ScriptLine[] };
};

type Phase = "intro" | "before" | "after" | "done";

export function PersonalReveal({ code, title, receiver, budget, script }: Props) {
  const t = useTranslations("reveal");
  const locale = useLocale();
  const sound = useSoundGate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [phaseStart, setPhaseStart] = useState(0);
  const lines = phase === "before" ? script.before : phase === "after" ? script.after : null;
  const go = (next: Phase) => {
    setPhase(next);
    setPhaseStart(Date.now());
    if (next === "after") void markRevealedAction(code);
  };
  const { current } = useVoice(lines, `${phase}@${phaseStart}`, phaseStart, phase === "before" || phase === "after", locale, () =>
    go(phase === "before" ? "after" : "done"),
  );
  const level = useMouth(!!current);
  const revealed = phase === "after" || phase === "done";
  const drumroll = phase === "before" && current?.cue === "drumroll";

  return (
    <main className="relative h-dvh overflow-hidden bg-wall [container-type:inline-size]">
      <Vignette set="stage" focus="50% 40%" priority className="absolute! inset-0 rounded-none" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4">
        <p className="truncate rounded-full bg-snow px-4 py-2 font-display text-sm font-bold text-ink">{title}</p>
        {sound.enabled && <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />}
      </header>

      <motion.div
        className="absolute bottom-[calc(7rem+4dvh)] left-1/2 w-[min(84vw,54dvh)]"
        animate={{ scale: revealed ? 0.72 : 1, x: "-50%" }}
        style={{ transformOrigin: "50% 100%" }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <SantaPuppet level={level} priority className="w-full" />
      </motion.div>
      <motion.div
        className="absolute bottom-[calc(7rem-6dvh)] left-1/2 w-[min(110vw,74dvh)]"
        style={{ x: "-50%" }}
        animate={drumroll ? { rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] } : { rotate: 0, y: 0 }}
        transition={drumroll ? { duration: 0.28, repeat: Infinity } : { duration: 0.3 }}
      >
        <Cast who="presents" className="relative! w-full" priority />
      </motion.div>

      {revealed && <Confetti count={36} scale={3.2} />}

      <AnimatePresence>
        {revealed && (
          <motion.div
            key="receiver"
            initial={{ opacity: 0, y: -40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ type: "spring", stiffness: 160, damping: 14 }}
            className="absolute inset-x-5 top-[max(4.5rem,9dvh)] z-10 mx-auto flex max-w-sm flex-col items-center rounded-felt bg-snow px-6 py-6 text-center"
          >
            <p className="text-muted">{t("youGiveTo")}</p>
            <div className="mt-3 h-[min(9rem,18dvh)] w-[min(9rem,18dvh)]">
              <Avatar config={receiver.avatar} className="h-full w-full" title={receiver.displayName} />
            </div>
            <p data-testid="receiver-name" className="mt-3 font-display text-5xl font-black leading-none text-berry">{receiver.displayName}</p>
            {budget && <p className="mt-3 text-muted">{t("budget", { budget })}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 z-20 flex min-h-28 flex-col items-center justify-center gap-3 bg-berry px-5 py-4 text-center text-snow">
        <AnimatePresence mode="wait">
          {current && (
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl font-display text-xl font-bold leading-snug md:text-2xl"
              aria-live="polite"
            >
              {current.text}
            </motion.p>
          )}
        </AnimatePresence>
        {phase === "done" && (
          <div className="flex gap-3">
            <button className="btn-soft" onClick={() => go("before")}>{t("again")}</button>
            <Link href={`/s/${code}/me`} className="btn-pine">{t("back")}</Link>
          </div>
        )}
        {phase === "before" && (
          <button className="text-sm text-snow/75 underline" onClick={() => go("after")}>{t("skip")}</button>
        )}
      </div>

      {!sound.enabled && (
        <SoundGateOverlay
          onEnable={async () => {
            await sound.enable();
            go("before");
          }}
        />
      )}
    </main>
  );
}
