"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { JoinCodeForm } from "../JoinCodeForm";
import { SiteHeader } from "../SiteHeader";
import { SantaPuppet } from "../show/SantaPuppet";
import { Confetti } from "../show/ShowStage";
import { CoverStage } from "./CoverStage";
import { useHoHo } from "./useHoHo";
import { Link } from "@/i18n/navigation";

const pop = { type: "spring", stiffness: 170, damping: 13 } as const;

export function HeroShow() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const camera = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const signY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);

  const [greeting, setGreeting] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setGreeting((g) => g + 1), 7000);
    return () => clearInterval(timer);
  }, []);
  const level = useHoHo(greeting, greeting === 1 ? 2300 : 0);

  return (
    <section ref={ref} className="relative flex flex-col overflow-hidden bg-wall md:block md:h-svh md:min-h-[40rem]">
      <div className="relative order-2 h-[60svh] overflow-hidden [container-type:size] md:absolute md:inset-0 md:h-auto">
        <CoverStage set="stage" scale={camera} origin="50% 55%" priority>
          <div className="absolute left-[21%] top-[6.5%] h-[13%] w-[58%] animate-bulbs rounded-full bg-gold/10 mix-blend-screen" />

          <motion.div
            className="absolute left-[37%] top-[24%] w-[26%]"
            initial={{ y: "75%" }}
            animate={{ y: 0 }}
            transition={{ ...pop, delay: 1.1 }}
          >
            <motion.div
              animate={{ rotate: level > 0 ? 0 : [-1.4, 1.4, -1.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "50% 100%" }}
            >
              <SantaPuppet level={level} priority />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute left-[64%] top-[42%] w-[23%]"
            initial={{ y: "90%" }}
            animate={{ y: ["0%", "-3%", "0%"] }}
            transition={{ y: { delay: 1.9, duration: 1, repeat: Infinity, ease: "easeInOut" } }}
          >
            <motion.div initial={{ y: "90%" }} animate={{ y: 0 }} transition={{ ...pop, delay: 1.7 }}>
              <Image src="/show/elves.webp" alt="" width={900} height={896} unoptimized className="h-auto w-full" />
            </motion.div>
          </motion.div>

          <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized priority className="absolute bottom-[2%] left-[30%] w-[40%]" />
          <Image
            src="/show/presents.webp"
            alt=""
            width={1280}
            height={470}
            unoptimized
            className="absolute -bottom-[4%] left-[59%] w-[38%] -scale-x-100"
          />
          <Confetti count={34} />
        </CoverStage>
        <OpeningCurtains />
      </div>

      <div className="relative order-1 z-30 bg-wall md:absolute md:inset-x-0 md:top-0 md:bg-transparent">
        <SiteHeader tone="dark" />
      </div>

      <motion.div
        className="relative order-3 z-20 -mt-14 px-4 pb-12 md:absolute md:left-[max(1.25rem,4vw)] md:top-[15%] md:mt-0 md:w-[clamp(23rem,36vw,36rem)] md:p-0"
        style={{ y: signY }}
      >
        <motion.div
          initial={{ y: "-130%", rotate: -7 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ y: { ...pop, delay: 1.4 }, rotate: { type: "spring", stiffness: 60, damping: 4, delay: 1.6 } }}
          style={{ transformOrigin: "50% -40%" }}
        >
          <div className="absolute bottom-full left-[16%] hidden h-[100svh] w-1.5 rounded-full bg-gold-dark md:block" />
          <div className="absolute bottom-full right-[16%] hidden h-[100svh] w-1.5 rounded-full bg-gold-dark md:block" />
          <div className="relative rounded-felt bg-berry p-2.5">
            <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/45" />
            <div className="relative rounded-[1.3rem] bg-paper p-5 md:p-8">
              <h1 className="font-display text-[2.15rem] font-black leading-[0.95] tracking-[-0.025em] text-berry md:text-[clamp(2.4rem,3.3vw,3.7rem)]">
                {t("title")}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-ink">{t("heroLead")}</p>
              <Link href="/new" className="btn-primary mt-6 w-full text-lg sm:w-auto">
                {t("create")}
              </Link>
              <div className="mt-6 rounded-[1rem] bg-cream p-4">
                <p className="label">{t("haveCode")}</p>
                <JoinCodeForm />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function OpeningCurtains() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {[0, 1].map((side) => (
        <motion.div
          key={side}
          className="absolute top-0 h-full w-[52%]"
          style={{ [side ? "right" : "left"]: 0 }}
          initial={{ x: 0 }}
          animate={{ x: side ? "105%" : "-105%" }}
          transition={{ delay: 0.35, duration: 1.6, ease: [0.7, 0, 0.3, 1] }}
        >
          <Image
            src="/show/curtain.webp"
            alt=""
            fill
            unoptimized
            priority
            sizes="52vw"
            className="object-cover"
            style={{ transform: side ? "scaleX(-1)" : undefined }}
          />
        </motion.div>
      ))}
    </div>
  );
}
