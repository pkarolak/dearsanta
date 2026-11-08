"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Cast } from "./show/Vignette";
import type { AvatarConfig } from "@/lib/avatar";
import { workshopAudio } from "@/lib/audio/engine";

type Props = {
  receiver: { displayName: string; avatar: AvatarConfig };
  budget: string | null;
  initiallyRevealed?: boolean;
  onReveal?: () => void;
};

const HOLD_MS = 1400;

/** A wrapped gift that opens only while pressed, so neighbours can't peek at the screen. */
export function RevealCard({ receiver, budget, initiallyRevealed, onReveal }: Props) {
  const t = useTranslations("reveal");
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [everRevealed, setEverRevealed] = useState(!!initiallyRevealed);
  const holdStart = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const begin = () => {
    if (open) return;
    holdStart.current = performance.now();
    const tick = () => {
      if (holdStart.current === null) return;
      const p = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        holdStart.current = null;
        setOpen(true);
        void workshopAudio()
          .unlock()
          .then(() => workshopAudio().chime())
          .catch(() => {});
        if (!everRevealed) {
          setEverRevealed(true);
          onReveal?.();
        }
        navigator.vibrate?.(60);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const end = () => {
    holdStart.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  return (
    <div className="relative overflow-hidden rounded-felt bg-pine p-6 text-center text-snow">
      <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/35" />
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="mt-4 flex flex-col items-center"
          >
            <p className="text-snow/80">{t("youGiveTo")}</p>
            <div className="mt-3 h-36 w-36 rounded-full bg-snow p-1">
              <Avatar config={receiver.avatar} className="h-full w-full" title={receiver.displayName} />
            </div>
            <p data-testid="receiver-name" className="mt-3 font-display text-5xl font-black text-gold">{receiver.displayName}</p>
            {budget && <p className="mt-2 text-snow/80">{t("budget", { budget })}</p>}
            <button className="btn-soft relative mt-5 px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              {t("hide")}
            </button>
          </motion.div>
        ) : (
          <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex flex-col items-center">
            <button
              className="relative h-56 w-56 touch-none select-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-gold"
              onPointerDown={begin}
              onPointerUp={end}
              onPointerLeave={end}
              onPointerCancel={end}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && begin()}
              onKeyUp={end}
              aria-label={t("hold")}
            >
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(255 249 240 / 0.18)" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#F2B935"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={289}
                  strokeDashoffset={289 * (1 - progress)}
                />
              </svg>
              <motion.div animate={{ rotate: progress > 0 ? [-4, 4, -4] : 0, scale: 1 + progress * 0.12 }} transition={{ duration: 0.25, repeat: progress > 0 ? Infinity : 0 }}>
                <div className="relative mx-auto w-24">
                  <Cast who="stocking" className="relative! w-full" />
                </div>
              </motion.div>
            </button>
            <p className="mt-3 font-display text-2xl font-bold">{t("hold")}</p>
            <p className="text-sm text-snow/75">{t("holdHint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
