"use client";

import { Star } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import { RemoteIcon } from "../icons";
import type { StageElf } from "./ShowStage";

const wedgeColours = ["#9e1b26", "#1d5a3a", "#c8952e"];
const bulbs = 24;
const placeholders = 8;

const looksOf = (e: StageElf) => JSON.stringify(e.avatar);
const fix = (n: number) => Math.round(n * 1000) / 1000;

function wedgePath(i: number, n: number) {
  if (n === 1) return "M100 100m-100 0a100 100 0 1 0 200 0a100 100 0 1 0 -200 0";
  const a0 = ((i - 0.5) / n) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
  const p = (a: number) => `${fix(100 + 100 * Math.cos(a))} ${fix(100 + 100 * Math.sin(a))}`;
  return `M100 100L${p(a0)}A100 100 0 ${n === 2 ? 1 : 0} 1 ${p(a1)}Z`;
}

const colourOf = (i: number, n: number) => (n % 2 && i === n - 1 && n > 1 ? wedgeColours[2] : wedgeColours[i % 2]);

/**
 * Santa's wheel of fortune in the living room. Every elf who joins takes a wedge; whoever just walked in
 * or changed their look is spun round to the pointer, so the whole room sees them.
 */
export function FortuneWheel({ elves, celebrate, remoteLabel, className = "" }: { elves: StageElf[]; celebrate?: boolean; remoteLabel?: string; className?: string }) {
  const rotation = useMotionValue(0);
  const upright = useTransform(rotation, (v) => -v);
  const [seen, setSeen] = useState(elves);
  const [star, setStar] = useState<{ id: string; n: number } | null>(null);
  const spinning = useRef<ReturnType<typeof animate> | null>(null);

  if (seen !== elves) {
    const before = new Map(seen.map((e) => [e.id, looksOf(e)]));
    const changed = elves.find((e) => before.get(e.id) !== looksOf(e));
    setSeen(elves);
    if (changed) setStar((s) => ({ id: changed.id, n: (s?.n ?? 0) + 1 }));
  }

  const n = elves.length;
  const starIndex = star ? elves.findIndex((e) => e.id === star.id) : -1;
  const starTurn = star?.n;

  useEffect(() => {
    if (starTurn === undefined || starIndex < 0) return;
    const current = rotation.get();
    const target = -(starIndex / n) * 360;
    const forward = (((target - current) % 360) + 360) % 360;
    spinning.current?.stop();
    spinning.current = animate(rotation, current + 360 + forward, { duration: 2.4, ease: [0.12, 0.6, 0.1, 1] });
    const timer = setTimeout(() => setStar(null), 6000);
    return () => clearTimeout(timer);
  }, [starTurn, starIndex, n, rotation]);

  useEffect(() => {
    if (!celebrate) return;
    spinning.current?.stop();
    spinning.current = animate(rotation, rotation.get() + 720, { duration: 3.2, ease: [0.3, 0.1, 0.1, 1] });
  }, [celebrate, rotation]);

  const ring = 29.5;
  const size = n ? Math.min(25, ((2 * Math.PI * ring) / n) * 0.8) : 0;
  const named = n > 0 && n <= 12;
  const starred = starIndex >= 0 ? elves[starIndex] : null;

  return (
    <div className={`@container absolute aspect-square ${className}`}>
      {/* the stand */}
      <div
        aria-hidden
        className="absolute left-[34%] top-[70%] h-[40%] w-[32%] bg-[linear-gradient(90deg,#7a4a12,#d9a53c_30%,#fff0b8_48%,#d9a53c_62%,#6a3c0c)] [clip-path:polygon(36%_0,64%_0,100%_100%,0_100%)]"
      />
      <div
        aria-hidden
        className="absolute left-[20%] top-[106%] h-[8%] w-[60%] rounded-[2.5cqw] bg-[linear-gradient(180deg,#fff0b8,#d9a53c_40%,#8f5f18)] shadow-[0_2.5cqw_4cqw_rgb(0_0_0/0.5),inset_0_-0.8cqw_0_rgb(0_0_0/0.25)]"
      />

      {/* rim with marquee bulbs */}
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,#f7dc8a,#b98222,#f9e7a6,#a8721c,#f3d27a,#b98222,#f7dc8a)] shadow-[0_3cqw_6cqw_-1cqw_rgb(0_0_0/0.6),inset_0_0_0_0.6cqw_rgb(120_70_10/0.55)]">
        {Array.from({ length: bulbs }, (_, i) => {
          const a = (i / bulbs) * 2 * Math.PI;
          return (
            <span
              key={i}
              aria-hidden
              className="animate-twinkle absolute h-[3.2%] w-[3.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff6d8] shadow-[0_0_1.6cqw_0.5cqw_rgb(255_214_120/0.85)]"
              style={{ left: `${fix(50 + 46.8 * Math.sin(a))}%`, top: `${fix(50 - 46.8 * Math.cos(a))}%`, animationDelay: `${(i % 2) * -1.2}s`, animationDuration: "1.2s" }}
            />
          );
        })}
      </div>

      {/* the turning face */}
      <motion.div className="absolute inset-[7%] rounded-full shadow-[inset_0_0_3cqw_rgb(0_0_0/0.55)]" style={{ rotate: rotation }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full rounded-full" aria-hidden>
          <defs>
            <radialGradient id="wheel-shade" cx="50%" cy="50%" r="50%">
              <stop offset="0.35" stopColor="#fff" stopOpacity="0.16" />
              <stop offset="0.8" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.35" />
            </radialGradient>
          </defs>
          {(n ? elves : Array.from({ length: placeholders })).map((_, i, all) => (
            <path key={i} d={wedgePath(i, all.length)} fill={n ? colourOf(i, all.length) : wedgeColours[i % 2]} opacity={n ? 1 : 0.55} />
          ))}
          {(n || placeholders) > 1 &&
            Array.from({ length: n || placeholders }, (_, i) => {
              const a = ((i + 0.5) / (n || placeholders)) * 2 * Math.PI - Math.PI / 2;
              return <line key={i} x1="100" y1="100" x2={fix(100 + 100 * Math.cos(a))} y2={fix(100 + 100 * Math.sin(a))} stroke="#f3d27a" strokeWidth="1.4" />;
            })}
          <circle cx="100" cy="100" r="100" fill="url(#wheel-shade)" />
          <circle cx="100" cy="100" r="98.5" fill="none" stroke="#f3d27a" strokeWidth="3" />
        </svg>

        {elves.map((e, i) => {
          const a = (i / n) * 2 * Math.PI;
          const isStar = starred?.id === e.id;
          return (
            <WheelSeat
              key={e.id}
              elf={e}
              upright={upright}
              size={size}
              named={named}
              isStar={isStar}
              remoteLabel={remoteLabel}
              left={n === 1 ? 50 : fix(50 + (ring / 0.86) * Math.sin(a))}
              top={n === 1 ? 50 : fix(50 - (ring / 0.86) * Math.cos(a))}
            />
          );
        })}
      </motion.div>

      {/* hub */}
      <div className="absolute left-1/2 top-1/2 grid h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e2b04a_45%,#8f5f18)] shadow-[0_1cqw_2.5cqw_rgb(0_0_0/0.5),inset_0_0_0_0.5cqw_rgb(255_240_190/0.6)]">
        <Star weight="fill" className="h-[55%] w-[55%] text-berry drop-shadow-[0_0.3cqw_0.3cqw_rgb(0_0_0/0.3)]" />
      </div>

      {/* pointer */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[-4%] h-[14%] w-[10%] -translate-x-1/2 origin-top"
        animate={starred ? { rotate: [0, -14, 10, -6, 0] } : { rotate: 0 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#fff0b8,#d9a53c_55%,#8f5f18)] drop-shadow-[0_1cqw_1cqw_rgb(0_0_0/0.5)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <div className="absolute left-1/2 top-[14%] h-[34%] w-[48%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff9aa2,#b8202c_55%,#5c0c12)]" />
      </motion.div>

      {/* who just stepped up */}
      <AnimatePresence>
        {starred && (
          <motion.p
            key={`${starred.id}-${star?.n}`}
            className="absolute left-1/2 top-[99%] z-10 w-max max-w-[120%] -translate-x-1/2 truncate rounded-full bg-paper px-[5cqw] py-[1.6cqw] text-center font-display text-[8cqw] font-black leading-none text-berry shadow-[0_2cqw_4cqw_rgb(0_0_0/0.4)] ring-[0.8cqw] ring-gold"
            initial={{ opacity: 0, y: "40%", scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "-30%", scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 1.6 }}
          >
            {starred.displayName}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function WheelSeat({
  elf,
  upright,
  size,
  named,
  isStar,
  left,
  top,
  remoteLabel,
}: {
  elf: StageElf;
  upright: MotionValue<number>;
  size: number;
  named: boolean;
  isStar: boolean;
  left: number;
  top: number;
  remoteLabel?: string;
}) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${left}%`, top: `${top}%`, width: `${size / 0.86}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isStar ? 1.3 : 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: isStar ? 2 : 0 }}
    >
      <motion.div className="relative" style={{ rotate: upright }}>
        <Avatar
          config={elf.avatar}
          title={elf.displayName}
          className={`w-full shadow-[0_1cqw_2cqw_rgb(0_0_0/0.45)] ring-[0.8cqw] ${isStar ? "ring-[#fff3c4]" : "ring-[#f3d27a]"}`}
        />
        {elf.isRemote && (
          <span className="absolute -right-[6%] bottom-[2%] grid aspect-square w-[34%] place-items-center rounded-full bg-gold text-ink ring-[0.5cqw] ring-paper" title={remoteLabel}>
            <RemoteIcon className="h-[60%] w-[60%]" />
          </span>
        )}
        {named && (
          <p className="absolute left-1/2 top-[88%] w-max max-w-[150%] -translate-x-1/2 truncate rounded-full bg-paper px-[0.7em] py-[0.15em] text-center font-display font-bold leading-tight text-ink shadow-[0_0.6cqw_1.2cqw_rgb(0_0_0/0.35)]"
            style={{ fontSize: `${Math.max(3.2, size * 0.2)}cqw` }}
          >
            {elf.displayName}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
