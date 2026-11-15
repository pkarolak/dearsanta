"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { SantaPuppet } from "./SantaPuppet";
import { ElfPuppets } from "./ElfPuppets";
import { FortuneWheel, type WheelDraw } from "./FortuneWheel";
import { useMouth } from "../useVoice";
import { Reindeer } from "./Vignette";
import type { AvatarConfig } from "@/lib/avatar";
import type { CeremonyStep } from "@/lib/ceremony/steps";

export type StageElf = { id: string; displayName: string; avatar: AvatarConfig; isRemote?: boolean };

type Props = {
  step: CeremonyStep;
  title: string;
  /** A note after the title, e.g. how many elves have gathered. */
  stepLabel?: string;
  elves: StageElf[];
  /** Santa is speaking: his mouth follows the voice. */
  talking?: boolean;
  /** A fixed mouth openness instead, for still pictures of the show. */
  level?: number;
  /** How far the wheel has got in the draw. */
  draw?: WheelDraw;
  subtitle: { id: string; text: string } | null;
  compact?: boolean;
  /** Content of the reindeer's card in the living room (the QR code, or the budget). */
  card?: React.ReactNode;
  /** The words on the reveal card or the farewell banner. */
  stageText?: { title: string; detail?: string };
  remoteLabel?: string;
  /** Shown beside Santa when he says goodbye, e.g. music for the rest of the evening. */
  farewellExtras?: React.ReactNode;
  /** Controls in the top-right corner, e.g. the host's "next chapter" button. */
  controls?: React.ReactNode;
  /** Santa has said goodbye: the curtain closes over the workshop for the farewell banner. */
  closed?: boolean;
};

/** Letterboxes a 16:9 show into whatever box it is given; everything inside is sized in container units. */
export function ShowFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-wall [container-type:size] ${className}`}>
      <div className="@container relative aspect-video w-[min(100cqw,calc(100cqh*16/9))] overflow-hidden">{children}</div>
    </div>
  );
}

export function ShowStage(props: Props) {
  const { title, stepLabel, subtitle, compact, controls, closed, stageText, farewellExtras } = props;

  return (
    <>
      <Workshop {...props} />
      <AnimatePresence>
        {closed && <FinalCurtain key="curtain" title={stageText?.title} extras={farewellExtras} compact={compact} />}
      </AnimatePresence>

      <div className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-[1cqw] ${compact ? "p-[2.5cqw]" : "p-[1.6cqw]"}`}>
        <p
          className={`rounded-full bg-snow px-[1.4em] py-[0.5em] font-display font-semibold text-ink transition-opacity duration-700 ${compact ? "text-[2.6cqw]" : "text-[1.25cqw]"} ${closed ? "opacity-0" : ""}`}
        >
          {title}
          {stepLabel && <span className="font-sans font-medium text-muted"> · {stepLabel}</span>}
        </p>
        {controls}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20" aria-live="polite">
        <SubtitleBar line={subtitle} compact={compact} />
      </div>
    </>
  );
}

/** How long the bar stays up after Santa falls silent, so it doesn't drop between two lines of one speech. */
const subtitleHoldMs = 2500;

/** Santa's subtitles on a berry bar that stays put while he talks; only the words change, and the bar grows or shrinks with them. */
function SubtitleBar({ line, compact }: { line: Props["subtitle"]; compact?: boolean }) {
  const [held, setHeld] = useState(line);
  if (line && (line.id !== held?.id || line.text !== held.text)) setHeld(line);
  useEffect(() => {
    if (line) return;
    const id = setTimeout(() => setHeld(null), subtitleHoldMs);
    return () => clearTimeout(id);
  }, [line]);

  const [height, setHeight] = useState<number | "auto">("auto");
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {held && (
        <motion.div
          key="bar"
          initial={{ y: "100%" }}
          animate={{ y: 0, height }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden bg-berry"
        >
          <div
            ref={measure}
            className={`text-center font-display font-semibold leading-snug text-snow ${
              compact ? "px-[4cqw] py-[1.6cqw] text-[3.4cqw]" : "px-[8cqw] py-[1.1cqw] text-[2.2cqw]"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={held.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {held.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const glide = { type: "spring", stiffness: 70, damping: 18 } as const;

/** The whole ceremony happens in Santa's workshop; for the draw the wheel steps forward and Santa makes room. */
function Workshop({ step, elves, talking, level, draw, card, remoteLabel, stageText }: Props) {
  const calm = useReducedMotion();
  const showReindeer = (step === "lobby" || step === "welcome" || step === "rules") && card;
  const drawing = step === "draw" || step === "reveal" || step === "farewell";

  return (
    <>
      <Image src="/show/set-living-room.webp" alt="" fill priority unoptimized sizes="100vw" className="object-cover" />

      {/* Santa stays in his armchair for the whole show; the wheel comes to him. */}
      <div className="absolute left-[31%] top-[23%] w-[34%]">
        <Santa talking={talking} level={level} />
      </div>
      <div className="absolute bottom-[-2%] left-[21%] w-[54%]">
        <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="h-auto w-full" />
      </div>

      <AnimatePresence>
        {showReindeer && (
          <motion.div
            key="reindeer"
            className="absolute left-[68%] top-[22%] w-[29%]"
            style={{ transformOrigin: "50% 100%" }}
            initial={{ x: "70%", rotate: 8 }}
            animate={{ x: 0, rotate: -4 }}
            exit={{ x: "80%", rotate: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <motion.div
              style={{ transformOrigin: "50% 100%" }}
              animate={calm ? undefined : { rotate: [0, 1.2, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Reindeer className="relative! w-full">{card}</Reindeer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute aspect-square"
        initial={false}
        animate={drawing ? { left: "1.5%", top: "10%", width: "34%" } : { left: "1.5%", top: "17%", width: "29%" }}
        transition={glide}
      >
        <FortuneWheel elves={elves} celebrate={step === "elves"} draw={drawing ? (draw ?? "stopped") : undefined} remoteLabel={remoteLabel} className="inset-0" />
      </motion.div>

      <AnimatePresence>
        {step === "elves" && <Elves key="elves" className="left-[73%] top-[38%] w-[23%]" />}
        {step === "farewell" && (
          <Elves key="farewell" className="left-[73%] top-[38%] w-[23%]" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === "reveal" && stageText && (
          <motion.div
            key="reveal-card"
            className="absolute left-[76%] top-[24%] w-[21%] rounded-[1.6cqw] bg-snow p-[1.6cqw] text-center shadow-[0_2cqw_4cqw_-1cqw_rgb(0_0_0/0.5)]"
            initial={{ scale: 0.6, opacity: 0, rotate: 6 }}
            animate={{ scale: 1, opacity: 1, rotate: -2 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.4 }}
          >
            <Image src="/show/stocking.webp" alt="" width={420} height={899} unoptimized className="mx-auto w-[30%] animate-sway" />
            <p className="mt-[0.8cqw] font-display text-[2cqw] font-bold leading-tight text-ink">{stageText.title}</p>
            {stageText.detail && <p className="mt-[0.5cqw] text-[1.15cqw] text-muted">{stageText.detail}</p>}
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}

/** The show's last picture: the curtain closes, the greeting drops in from above and the music waits below it. */
function FinalCurtain({ title, extras, compact }: { title?: string; extras?: React.ReactNode; compact?: boolean }) {
  const calm = useReducedMotion();
  const closing = calm ? 0 : 2.2;
  return (
    <motion.div className="absolute inset-0 z-[15]" exit={{ opacity: 0 }}>
      {[0, 1].map((side) => (
        <motion.div
          key={side}
          className="absolute top-0 h-full w-[52%]"
          style={{ [side ? "right" : "left"]: 0 }}
          initial={{ x: side ? "100%" : "-100%" }}
          animate={{ x: 0 }}
          transition={{ duration: closing, ease: [0.45, 0, 0.2, 1] }}
        >
          <Image src="/show/curtain.webp" alt="" fill unoptimized sizes="50vw" className="object-cover" style={{ transform: side ? "scaleX(-1)" : undefined }} />
        </motion.div>
      ))}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-[#1c0c0b]/85 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2.2cqw] pb-[2cqw]">
        {title && (
          <motion.div
            className={`rounded-[1.4cqw] bg-berry text-center shadow-[0_1.6cqw_3cqw_-0.6cqw_rgb(0_0_0/0.6)] outline-[0.16cqw] outline-offset-[-0.6cqw] outline-dashed outline-snow/75 ${
              compact ? "px-[4cqw] py-[2cqw]" : "px-[3cqw] py-[1.4cqw]"
            }`}
            initial={{ y: "-60cqh" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 110, damping: 12, delay: closing + 0.2 }}
          >
            <p className={`font-display font-black leading-none text-snow ${compact ? "text-[8cqw]" : "text-[5.4cqw]"}`}>{title}</p>
          </motion.div>
        )}
        {extras && (
          <motion.div
            className="w-[34cqw]"
            initial={{ y: "12%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 18, delay: closing + 1 }}
          >
            {extras}
          </motion.div>
        )}
      </div>
      {!calm && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: closing + 0.4 }}>
          <Confetti count={compact ? 18 : 42} />
        </motion.div>
      )}
    </motion.div>
  );
}

/** Only Santa re-renders while he talks, so the rest of the workshop keeps animating smoothly. */
function Santa({ talking, level = 0 }: { talking?: boolean; level?: number }) {
  const voice = useMouth(!!talking);
  const mouth = talking ? voice : level;
  const still = talking || level > 0;
  return (
    <motion.div
      animate={{ rotate: still ? 0 : [-1.2, 1.2, -1.2] }}
      transition={still ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <SantaPuppet level={mouth} priority />
    </motion.div>
  );
}

/** The elves pop up from below, then keep hopping; the two moves are separate so the hop never snaps the entrance. */
function Elves({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ y: "70%", opacity: 0 }}
      animate={{ y: "0%", opacity: 1 }}
      exit={{ y: "80%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
    >
      <ElfPuppets />
    </motion.div>
  );
}

const confettiColours = ["#F2B935", "#B8202C", "#1D5A3A", "#FFF9F0", "#E77B7F"];

export function Confetti({ count, scale = 1 }: { count: number; scale?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const size = (0.5 + ((i * 13) % 5) * 0.15) * scale;
        return (
          <span
            key={i}
            className="animate-confetti absolute block rounded-[0.1cqw]"
            style={{
              left: `${(i * 37) % 100}%`,
              width: `${size}cqw`,
              height: `${size * 0.55}cqw`,
              background: confettiColours[i % confettiColours.length],
              animationDuration: `${4 + (i % 5) * 0.6}s`,
              animationDelay: `${-(i % 11) * 0.45}s`,
            }}
          />
        );
      })}
    </div>
  );
}
