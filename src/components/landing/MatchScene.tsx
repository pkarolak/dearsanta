"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { RevealCard } from "../RevealCard";
import { Aurora, Snowfall, Stars } from "./Atmosphere";
import { useDepth, useSceneScroll } from "./useDepth";
import { seededAvatar } from "@/lib/avatar";

const receiver = { displayName: "Ola", avatar: seededAvatar("ola") };
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.5 },
  transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const, delay },
});

export function MatchScene() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const p = useSceneScroll(ref);
  const sky = useDepth(p, [0, 1], [-18, 14]);
  const lights = useDepth(p, [0, 1], [-40, 25]);
  const words = useDepth(p, [0, 0.5, 1], [30, 0, -25]);
  const phone = useDepth(p, [0, 0.5, 1], [35, 0, -30]);
  const tilt = useDepth(p, [0, 0.5, 1], [7, 0, -6], "deg");
  const walk = useDepth(p, [0.35, 1], [0, -40]);
  const hop = useDepth(p, [0.35, 0.5, 0.65, 0.8, 1], [0, -8, 0, -8, 0]);
  return (
    <section
      ref={ref}
      className="relative z-10 overflow-hidden rounded-t-[2.5rem] bg-[linear-gradient(180deg,#141d40_0%,#101a3c_26%,#0d1a42_62%,#1c0c0b_100%)] text-snow shadow-[0_-30px_60px_-10px_rgb(0_0_0/0.55)] md:rounded-t-[4rem]"
    >
      <motion.div className="absolute inset-0" style={{ y: sky }}>
        <Stars className="top-[8%] bottom-[25%]" />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: lights }}>
        <Aurora className="top-[14%]" />
      </motion.div>
      <Snowfall count={46} />
      <div className="relative mx-auto grid min-h-svh max-w-7xl items-center gap-14 px-5 py-24 md:grid-cols-[1fr_1fr] md:px-8 md:py-32">
        <motion.div style={{ y: words }}>
          <motion.h2
            {...rise(0)}
            className="glow-text font-display text-5xl font-black leading-[0.95] tracking-[-0.03em] md:text-[clamp(3.5rem,6vw,6.5rem)]"
          >
            {t("matchTitle")}
          </motion.h2>
          <motion.p {...rise(0.08)} className="glow-text mt-6 max-w-md text-lg leading-relaxed text-snow/90 md:text-xl">
            {t("matchBody")}
          </motion.p>
        </motion.div>

        <motion.div style={{ y: phone, rotate: tilt }}>
          <motion.div
            className="relative mx-auto w-[min(21rem,84vw)]"
            initial={{ opacity: 0, y: 80, rotate: 6 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 70, damping: 14 }}
          >
            <div
              aria-hidden
              className="absolute -inset-[30%] rounded-full bg-[radial-gradient(closest-side,rgb(255_200_110/0.45),transparent)]"
            />
            <motion.div
              className="absolute -bottom-[17%] -left-[2%] w-[38%] lg:-bottom-[4%] lg:-left-[60%] lg:w-[58%]"
              style={{ x: walk, y: hop }}
            >
              <motion.div
                initial={{ x: "-30%", opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  type: "spring",
                  stiffness: 90,
                  damping: 12,
                  delay: 0.5,
                }}
              >
                <Image
                  src="/show/elves.webp"
                  alt=""
                  width={807}
                  height={944}
                  unoptimized
                  className="h-auto w-full drop-shadow-[0_18px_22px_rgb(0_0_20/0.55)]"
                />
              </motion.div>
            </motion.div>
            <div
              data-ui
              className="relative rounded-[3rem] bg-ink p-2.5 shadow-[0_40px_90px_-25px_rgb(0_0_0/0.8),0_0_0_1.5px_rgb(255_220_150/0.25)]"
            >
              <div className="overflow-hidden rounded-[2.5rem] bg-snow">
                <div className="bg-wall px-6 pb-6 pt-12">
                  <p className="font-display text-3xl font-bold text-snow">{t("matchHello")}</p>
                </div>
                <div className="p-4 pb-8">
                  <RevealCard receiver={receiver} budget={null} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
