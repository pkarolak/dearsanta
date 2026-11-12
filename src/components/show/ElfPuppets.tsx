"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import Image from "next/image";

/** Source picture height; every layer of an elf is the full elf box, so pivots are plain percentages. */
const H = 944;

type Puppet = {
  name: "a" | "b";
  /** Box in the source picture (807 wide), in px. */
  left: number;
  width: number;
  pivots: { arm: string; head: string; legL: string; legR: string };
  /** +1 when the waving arm is on the elf's right side of the picture (raised up and left). */
  side: 1 | -1;
};

const puppets: Puppet[] = [
  { name: "a", left: 0, width: 432, side: 1, pivots: { arm: "36.6% 44.3%", head: "63% 41.8%", legL: "37% 77.9%", legR: "66.7% 77.9%" } },
  { name: "b", left: 404, width: 403, side: -1, pivots: { arm: "59.1% 49.8%", head: "42.4% 45.8%", legL: "25% 78.4%", legR: "53.1% 78.4%" } },
];

/**
 * One loop: crouch, jump with a heel kick, squashy landing, then a few waves while the head bobs.
 * All parts share the same keyframe times so the joints stay in step.
 */
const times = [0, 0.1, 0.18, 0.3, 0.42, 0.48, 0.56, 0.62, 0.68, 0.74, 0.8, 0.86, 0.92, 1];
const loop = (duration: number, delay: number): Transition => ({ duration, delay, times, repeat: Infinity, ease: "easeInOut" });

const motionFor = (side: 1 | -1) => ({
  //        rest  crouch takeoff apex  fall  land  settle wave…                        rest
  y: ["0%", "1%", "-5%", "-15%", "-3%", "1.5%", "0%", "0%", "0%", "0%", "0%", "0%", "0%", "0%"],
  scaleY: [1, 0.9, 1.08, 1, 1.04, 0.9, 1.02, 1, 1, 1, 1, 1, 1, 1],
  scaleX: [1, 1.06, 0.95, 1, 0.98, 1.07, 0.99, 1, 1, 1, 1, 1, 1, 1],
  rotate: [0, 0, -side * 2, side * 3, 0, 0, 0, side * 1.5, 0, -side * 1.5, 0, side * 1.5, 0, 0],
  head: [0, 4, -5, -3, 3, 6, -2, side * 4, -side * 3, side * 4, -side * 3, side * 3, 0, 0],
  arm: [0, -8, 20, 14, 24, -8, 4, -12, 10, -14, 10, -12, 6, 0].map((a) => side * a),
  legL: [0, 0, 4, 16, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  legR: [0, 0, -4, -16, -6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
});

/** The two workshop elves as jointed puppets: separate head, waving arm and legs. */
export function ElfPuppets({ className = "" }: { className?: string }) {
  const still = useReducedMotion();
  return (
    <div className={`relative aspect-[807/944] w-full ${className}`}>
      {puppets.map((p, i) => (
        <PuppetElf key={p.name} puppet={p} still={!!still} transition={loop(3.4 + i * 0.3, 0.6 + i * 1.5)} />
      ))}
    </div>
  );
}

function PuppetElf({ puppet: p, still, transition }: { puppet: Puppet; still: boolean; transition: Transition }) {
  const m = motionFor(p.side);
  const part = (file: string) => (
    <Image src={`/show/elves/${p.name}-${file}.webp`} alt="" fill unoptimized sizes="20vw" className="pointer-events-none select-none object-contain" />
  );
  const joint = (file: string, origin: string, rotate: number[]) => (
    <motion.div className="absolute inset-0" style={{ transformOrigin: origin }} animate={still ? undefined : { rotate }} transition={transition}>
      {part(file)}
    </motion.div>
  );

  return (
    <motion.div
      className="absolute top-0 h-full"
      style={{ left: `${(p.left / 807) * 100}%`, width: `${(p.width / 807) * 100}%`, transformOrigin: "50% 100%", aspectRatio: `${p.width}/${H}` }}
      animate={still ? undefined : { y: m.y, scaleY: m.scaleY, scaleX: m.scaleX, rotate: m.rotate }}
      transition={transition}
    >
      {joint("leg-l", p.pivots.legL, m.legL)}
      {joint("leg-r", p.pivots.legR, m.legR)}
      <div className="absolute inset-0">{part("body")}</div>
      {joint("head", p.pivots.head, m.head)}
      {joint("arm", p.pivots.arm, m.arm)}
    </motion.div>
  );
}
