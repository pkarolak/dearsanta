"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import layout from "./layout.json";
import { SantaPuppet } from "./SantaPuppet";
import { FortuneWheel } from "./FortuneWheel";
import type { AvatarConfig } from "@/lib/avatar";
import type { CeremonyStep } from "@/lib/ceremony/steps";

export type Act = "home" | "stage";
export const actFor = (step: CeremonyStep): Act => (step === "draw" || step === "reveal" || step === "farewell" ? "stage" : "home");

export type StageElf = { id: string; displayName: string; avatar: AvatarConfig; isRemote?: boolean };

type Props = {
  step: CeremonyStep;
  title: string;
  stepLabel: string;
  elves: StageElf[];
  level: number;
  subtitle: { id: string; text: string } | null;
  compact?: boolean;
  /** Content of the reindeer's card in the living room (the QR code, or the budget). */
  card?: React.ReactNode;
  /** The words on the stage act's show card (reveal) or banner (farewell). */
  stageText?: { title: string; detail?: string };
  remoteLabel?: string;
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
  const { step, title, stepLabel, subtitle, compact, controls } = props;
  const act = actFor(step);

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={act}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {act === "home" ? <LivingRoom {...props} /> : <Theatre {...props} />}
        </motion.div>
      </AnimatePresence>

      <div className={`absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-[1cqw] ${compact ? "p-[2.5cqw]" : "p-[1.6cqw]"}`}>
        <p className={`rounded-full bg-snow px-[1.4em] py-[0.5em] font-display font-semibold text-ink ${compact ? "text-[2.6cqw]" : "text-[1.25cqw]"}`}>
          {title} <span className="font-sans font-medium text-muted">· {stepLabel}</span>
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

function LivingRoom({ step, elves, level, card, remoteLabel }: Props) {
  const showReindeer = (step === "lobby" || step === "rules") && card;

  return (
    <>
      <Image src="/show/set-living-room.webp" alt="" fill priority unoptimized sizes="100vw" className="object-cover" />

      <Santa className="left-[31%] top-[23%] w-[34%]" level={level} />
      <Image
        src="/show/presents.webp"
        alt=""
        width={1280}
        height={470}
        unoptimized
        className="absolute bottom-[-2%] left-[21%] w-[54%]"
      />

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
      </AnimatePresence>
      <FortuneWheel elves={elves} celebrate={step === "elves"} remoteLabel={remoteLabel} className="left-[1.5%] top-[17%] w-[29%]" />
    </>
  );
}

function Theatre({ step, elves, level, stageText, compact }: Props) {
  return (
    <>
      <Image src="/show/set-stage.webp" alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
      <div className="absolute left-[21%] top-[6.5%] h-[13%] w-[58%] animate-bulbs rounded-full bg-gold/10 mix-blend-screen" />

      {step === "draw" && <ShufflingTags names={elves.map((e) => e.displayName)} />}

      <Santa className="left-[33%] top-[21%] w-[34%]" level={level} />
      <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="absolute bottom-[4%] left-[27%] w-[46%]" />

      {step === "reveal" && stageText && (
        <motion.div
          className="absolute left-[67%] top-[25%] w-[23%] rounded-[1.6cqw] bg-snow p-[1.6cqw] text-center"
          initial={{ scale: 0.6, opacity: 0, rotate: 6 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.8 }}
        >
          <Image src="/show/stocking.webp" alt="" width={420} height={899} unoptimized className="mx-auto w-[32%] animate-sway" />
          <p className="mt-[0.8cqw] font-display text-[2.2cqw] font-bold leading-tight text-ink">{stageText.title}</p>
          {stageText.detail && <p className="mt-[0.5cqw] text-[1.2cqw] text-muted">{stageText.detail}</p>}
        </motion.div>
      )}

      {step === "farewell" && stageText && (
        <motion.div
          className="stitched absolute left-[24%] top-[19%] w-[52%] rounded-[1.4cqw] bg-berry px-[2cqw] py-[1.2cqw] text-center"
          initial={{ y: "-60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.6 }}
        >
          <p className="font-display text-[4cqw] font-black leading-none text-snow">{stageText.title}</p>
        </motion.div>
      )}

      {(step === "reveal" || step === "farewell") && (
        <>
          <Elves className="left-[2%] top-[50%] w-[25%]" />
          <Confetti count={compact ? 18 : 42} />
        </>
      )}

      <Curtains />
    </>
  );
}

function Santa({ className, level }: { className: string; level: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{ rotate: level > 0 ? 0 : [-1.2, 1.2, -1.2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <SantaPuppet level={level} priority />
    </motion.div>
  );
}

function Elves({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ y: "70%" }}
      animate={{ y: ["0%", "-3%", "0%"] }}
      exit={{ y: "80%" }}
      transition={{ y: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } }}
    >
      <Image src="/show/elves.webp" alt="" width={807} height={944} unoptimized className="h-auto w-full" />
    </motion.div>
  );
}

export function Curtains() {
  return (
    <div className="pointer-events-none absolute left-[9%] top-[15%] h-[70%] w-[82%] overflow-hidden">
      {[0, 1].map((side) => (
        <motion.div
          key={side}
          className="absolute top-0 h-full w-1/2"
          style={{ left: side ? "50%" : 0 }}
          initial={{ x: 0 }}
          animate={{ x: side ? "102%" : "-102%" }}
          transition={{ delay: 0.5, duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
        >
          <Image
            src="/show/curtain.webp"
            alt=""
            fill
            unoptimized
            sizes="45vw"
            className="object-cover"
            style={{ transform: side ? "scaleX(-1)" : undefined }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function ShufflingTags({ names }: { names: string[] }) {
  const [order, setOrder] = useState(() => names.map((_, i) => i));
  useEffect(() => {
    const timer = setInterval(() => {
      setOrder((o) => {
        const next = [...o];
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
      });
    }, 650);
    return () => clearInterval(timer);
  }, []);
  const half = Math.ceil(order.length / 2);
  const columns = [order.slice(0, half), order.slice(half)];

  return (
    <LayoutGroup>
      {columns.map((column, side) => (
        <div
          key={side}
          className={`absolute top-[24%] flex w-[17%] flex-col items-center gap-[1cqw] ${side ? "right-[13%]" : "left-[13%]"}`}
        >
          {column.map((index) => (
            <motion.p
              layout
              key={index}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="max-w-full truncate rounded-[0.8cqw] bg-paper px-[1.2cqw] py-[0.5cqw] font-display text-[1.6cqw] font-bold text-berry"
              style={{ rotate: `${(index % 3) - 1}deg` }}
            >
              {names[index]}
            </motion.p>
          ))}
        </div>
      ))}
    </LayoutGroup>
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
