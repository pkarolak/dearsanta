"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { Confetti } from "../show/ShowStage";
import { Caption } from "./Caption";
import { CoverStage } from "./CoverStage";
import { demoElves } from "./GatherScene";
import { useHoHo } from "./useHoHo";

const shuffles = 7;
const wideSlots = [0, 1, 2, 3, 4, 5].map((i) => ({ left: i < 3 ? 7 : 72, top: 20 + (i % 3) * 12 }));
const narrowSlots = [0, 1, 2, 3, 4, 5].map((i) => ({ left: 4 + (i % 3) * 32, top: i < 3 ? 13 : 19.5 }));
const subscribeWidth = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

/** A fixed, scroll-indexed shuffle so scrubbing back and forth replays the same moves. */
function order(phase: number) {
  const idx = demoElves.map((_, i) => i);
  let seed = phase * 9301 + 49297;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export function DrawScene() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const camera = useTransform(p, [0, 1], [1, 1.16]);
  const [phase, setPhase] = useState(0);
  useMotionValueEvent(p, "change", (v) => setPhase(Math.min(shuffles + 1, Math.floor(v * (shuffles + 3)))));
  const drawn = phase > shuffles;
  const level = useHoHo(drawn, 300);
  const seats = order(phase);
  const narrow = useSyncExternalStore(subscribeWidth, () => window.innerWidth < 768, () => false);
  const slots = narrow ? narrowSlots : wideSlots;

  return (
    <section ref={ref} className="relative h-[320svh] bg-wall">
      <div className="sticky top-0 h-svh overflow-hidden [container-type:size]">
        <CoverStage set="stage" scale={camera} origin="50% 45%">
          <div className="absolute left-[21%] top-[6.5%] h-[13%] w-[58%] animate-bulbs rounded-full bg-gold/10 mix-blend-screen" />
          <div className="absolute left-[33%] top-[21%] w-[34%]">
            <SantaPuppet level={level} />
          </div>
          <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="absolute bottom-[4%] left-[27%] w-[46%]" />
          {drawn && <Confetti count={40} />}
        </CoverStage>

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {demoElves.map((e, i) => {
            const seat = slots[seats.indexOf(i)];
            return (
              <motion.p
                key={e.name}
                className="absolute rounded-[0.6em] bg-paper px-[0.8em] py-[0.35em] font-display text-[clamp(1rem,1.9vw,2rem)] font-bold text-berry"
                initial={false}
                animate={
                  drawn
                    ? { left: "47%", top: "26%", scale: 0.2, opacity: 0, rotate: 0 }
                    : { left: `${seat.left}%`, top: `${seat.top}%`, scale: 1, opacity: 1, rotate: (i % 3) - 1 }
                }
                transition={{ type: "spring", stiffness: 140, damping: 16, delay: drawn ? i * 0.06 : 0 }}
              >
                {e.name}
              </motion.p>
            );
          })}
        </div>
        <Caption title={t("drawTitle")} body={t("drawBody")} />
      </div>
    </section>
  );
}
