"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { GiftIcon } from "./icons";
import { NightScene } from "./NightScene";
import { Santa } from "./Santa";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { useMouth, useVoice } from "./useVoice";
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
  const { current } = useVoice(lines, phaseStart, phase === "before" || phase === "after", locale, () =>
    go(phase === "before" ? "after" : "done"),
  );
  const mouth = useMouth(!!current);
  const revealed = phase === "after" || phase === "done";

  return (
    <NightScene className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-between px-5 py-8 text-center">
        <header className="flex w-full items-center justify-between">
          <p className="font-display text-lg italic text-snow/80">{title}</p>
          {sound.enabled && <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />}
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.div key="santa" exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-6">
                <div className="w-[min(70vw,340px)]">
                  <Santa mouth={mouth} className="h-auto w-full drop-shadow-2xl" />
                </div>
                {phase === "before" && current?.cue === "drumroll" && (
                  <motion.div animate={{ rotate: [-8, 8, -8], scale: [1, 1.08, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
                    <GiftIcon className="h-24 w-24" />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="receiver"
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="clay-night flex flex-col items-center px-10 py-8"
              >
                <p className="text-snow/70">{t("youGiveTo")}</p>
                <div className="mt-4 h-40 w-40">
                  <Avatar config={receiver.avatar} className="h-full w-full" title={receiver.displayName} />
                </div>
                <p className="mt-4 font-display text-5xl text-gold">{receiver.displayName}</p>
                {budget && <p className="mt-3 text-snow/80">{t("budget", { budget })}</p>}
                <div className="mt-4 w-24">
                  <Santa mouth={mouth} mood="wink" className="h-auto w-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex min-h-28 flex-col items-center justify-end gap-4">
          <AnimatePresence mode="wait">
            {current && (
              <motion.p
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-xl rounded-3xl bg-night/70 px-6 py-3 font-display text-xl leading-snug md:text-2xl"
                aria-live="polite"
              >
                {current.text}
              </motion.p>
            )}
          </AnimatePresence>
          {phase === "done" && (
            <div className="flex gap-3">
              <button className="btn-soft" onClick={() => go("before")}>{t("again")}</button>
              <Link href={`/s/${code}/me`} className="btn-primary">{t("back")}</Link>
            </div>
          )}
          {phase === "before" && (
            <button className="text-sm text-snow/60 underline" onClick={() => go("after")}>{t("skip")}</button>
          )}
        </div>
      </div>
      {!sound.enabled && (
        <SoundGateOverlay
          onEnable={async () => {
            await sound.enable();
            go("before");
          }}
        />
      )}
    </NightScene>
  );
}
