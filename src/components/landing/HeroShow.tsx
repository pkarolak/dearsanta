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

          <div className="intro-pop absolute left-[37%] top-[24%] w-[26%] [animation-delay:1.1s]">
            <motion.div
              animate={{ rotate: level > 0 ? 0 : [-1.4, 1.4, -1.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "50% 100%" }}
            >
              <SantaPuppet level={level} priority />
            </motion.div>
          </div>

          <div className="animate-bob absolute left-[64%] top-[42%] w-[23%]">
            <div className="intro-pop [animation-delay:1.7s]">
              <Image src="/show/elves.webp" alt="" width={900} height={896} unoptimized priority className="h-auto w-full" />
            </div>
          </div>

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
        <div className="intro-sign">
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
        </div>
      </motion.div>
    </section>
  );
}

function OpeningCurtains() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {[0, 1].map((side) => (
        <div
          key={side}
          className={`absolute top-0 h-full w-[52%] bg-pine-dark ${side ? "intro-curtain-right right-0" : "intro-curtain-left left-0"}`}
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
        </div>
      ))}
    </div>
  );
}
