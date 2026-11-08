"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { RevealCard } from "../RevealCard";
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
  return (
    <section className="relative overflow-hidden bg-pine text-snow">
      <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-14 px-5 py-24 md:grid-cols-[1fr_1fr] md:px-8 md:py-32">
        <div>
          <motion.h2 {...rise(0)} className="font-display text-5xl font-black leading-[0.95] tracking-[-0.03em] md:text-[clamp(3.5rem,6vw,6.5rem)]">
            {t("matchTitle")}
          </motion.h2>
          <motion.p {...rise(0.08)} className="mt-6 max-w-md text-lg leading-relaxed text-snow/90 md:text-xl">
            {t("matchBody")}
          </motion.p>
        </div>

        <motion.div
          className="relative mx-auto w-[min(21rem,84vw)]"
          initial={{ opacity: 0, y: 80, rotate: 6 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 70, damping: 14 }}
        >
          <div data-ui className="relative rounded-[3rem] bg-ink p-2.5">
            <div className="overflow-hidden rounded-[2.5rem] bg-snow">
              <div className="bg-wall px-6 pb-6 pt-12">
                <p className="font-display text-3xl font-bold text-snow">{t("matchHello")}</p>
              </div>
              <div className="p-4 pb-8">
                <RevealCard receiver={receiver} budget={null} />
              </div>
            </div>
          </div>
          <motion.div
            className="absolute -bottom-[4%] -left-[42%] w-[62%]"
            initial={{ x: "-30%", opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 90, damping: 12, delay: 0.5 }}
          >
            <Image src="/show/elves.webp" alt="" width={807} height={944} unoptimized className="h-auto w-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
