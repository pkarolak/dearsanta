"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import layout from "./layout.json";
import { SantaPuppet } from "./SantaPuppet";
import { FortuneWheel, type WheelDraw } from "./FortuneWheel";
import { useMouth } from "../useVoice";
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
  const { title, stepLabel, subtitle, compact, controls } = props;

  return (
    <>
      <Workshop {...props} />

      <div className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-[1cqw] ${compact ? "p-[2.5cqw]" : "p-[1.6cqw]"}`}>
        <p className={`rounded-full bg-snow px-[1.4em] py-[0.5em] font-display font-semibold text-ink ${compact ? "text-[2.6cqw]" : "text-[1.25cqw]"}`}>
          {title}
          {stepLabel && <span className="font-sans font-medium text-muted"> · {stepLabel}</span>}
        </p>
        {controls}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20" aria-live="polite">
        <AnimatePresence mode="wait">
          {subtitle && (
            <motion.p
              key={subtitle.id}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`bg-berry text-center font-display font-semibold leading-snug text-snow ${
                compact ? "px-[4cqw] py-[1.6cqw] text-[3.4cqw]" : "px-[8cqw] py-[1.1cqw] text-[2.2cqw]"
              }`}
            >
              {subtitle.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const glide = { type: "spring", stiffness: 70, damping: 18 } as const;

/** The whole ceremony happens in Santa's workshop; for the draw the wheel steps forward and Santa makes room. */
function Workshop({ step, elves, talking, level, draw, card, remoteLabel, stageText, compact, farewellExtras }: Props) {
  const showReindeer = (step === "lobby" || step === "rules") && card;
  const drawing = step === "draw" || step === "reveal" || step === "farewell";

  return (
    <>
      <Image src="/show/set-living-room.webp" alt="" fill priority unoptimized sizes="100vw" className="object-cover" />

      <motion.div className="absolute top-[23%] w-[34%]" initial={false} animate={{ left: drawing ? "43%" : "31%" }} transition={glide}>
        <Santa talking={talking} level={level} />
      </motion.div>
      <motion.div className="absolute bottom-[-2%] w-[54%]" initial={false} animate={{ left: drawing ? "33%" : "21%" }} transition={glide}>
        <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="h-auto w-full" />
      </motion.div>

      <AnimatePresence>
        {showReindeer && (
          <motion.div
            key="reindeer"
            className="absolute left-[68%] top-[13%] w-[29%]"
            initial={{ x: "70%", rotate: 8 }}
            animate={{ x: 0, rotate: 0 }}
            exit={{ x: "80%", rotate: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
          >
            <div className="relative aspect-[3/4]">
              <Image src="/show/reindeer.webp" alt="" fill unoptimized sizes="30vw" className="object-contain" />
              <div
                className="@container absolute overflow-hidden rounded-[0.4cqw] bg-paper"
                style={{
                  left: `${layout.reindeerCard.left - 0.6}%`,
                  top: `${layout.reindeerCard.top - 0.4}%`,
                  width: `${layout.reindeerCard.width + 1.2}%`,
                  height: `${layout.reindeerCard.height + 0.8}%`,
                }}
              >
                {card}
              </div>
            </div>
            <Image
              src="/show/presents.webp"
              alt=""
              width={1280}
              height={470}
              unoptimized
              className="absolute -bottom-[30%] -left-[10%] w-[125%] max-w-none -scale-x-100"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === "elves" && <Elves key="elves" className="left-[0%] top-[54%] w-[25%]" />}
        {step === "farewell" && (
          <Elves key="farewell" className={farewellExtras ? "left-[1%] top-[56%] w-[21%]" : "left-[75%] top-[50%] w-[25%]"} />
        )}
      </AnimatePresence>

      <motion.div
        className="absolute aspect-square"
        initial={false}
        animate={drawing ? { left: "4%", top: "9%", width: "37%" } : { left: "1.5%", top: "17%", width: "29%" }}
        transition={glide}
      >
        <FortuneWheel elves={elves} celebrate={step === "elves"} draw={drawing ? (draw ?? "stopped") : undefined} remoteLabel={remoteLabel} className="inset-0" />
      </motion.div>

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
        {step === "farewell" && stageText && (
          <motion.div
            key="farewell-banner"
            className="stitched absolute left-[38%] top-[7%] w-[44%] rounded-[1.4cqw] bg-berry px-[2cqw] py-[1.1cqw] text-center"
            initial={{ y: "-60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.6 }}
          >
            <p className="font-display text-[3.6cqw] font-black leading-none text-snow">{stageText.title}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "farewell" && farewellExtras && (
        <motion.div
          className="absolute left-[75%] top-[19%] z-10 w-[23%]"
          initial={{ x: "40%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16, delay: 1.2 }}
        >
          {farewellExtras}
        </motion.div>
      )}
      {step === "farewell" && <Confetti count={compact ? 18 : 42} />}
    </>
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
      <motion.div
        animate={{ y: ["0%", "-3%", "0%"] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <Image src="/show/elves.webp" alt="" width={807} height={944} unoptimized className="h-auto w-full" />
      </motion.div>
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
