"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { JoinCodeForm } from "../JoinCodeForm";
import { SantaPuppet } from "../show/SantaPuppet";
import { Confetti } from "../show/ShowStage";
import { Aurora, Snowfall, Stars, StringLights } from "./Atmosphere";
import { CoverStage } from "./CoverStage";
import { useHoHo } from "./useHoHo";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";

export function FinaleScene() {
  const t = useTranslations("home");
  const tn = useTranslations("nav");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const leftCurtain = useTransform(p, [0.35, 1], ["-100%", "-12%"]);
  const rightCurtain = useTransform(p, [0.35, 1], ["100%", "12%"]);
  const shown = useInView(ref, { amount: 0.6, once: true });
  const level = useHoHo(shown, 1300);

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#101a3c,#0b1230)] px-5 pb-[max(3rem,5vw)] pt-20 text-snow md:px-8">
        <Stars count={50} />
        <Aurora className="-top-[20%]" />
        <StringLights swags={6} perSwag={6} sag={22} />
        <Snowfall count={30} />
        <div className="relative mx-auto max-w-7xl">
          <p className="font-display text-lg text-snow/85">{t("footer")}</p>
          <motion.p
            className="foil mt-8 whitespace-nowrap pr-[0.1em] font-display text-[calc((100vw-2.5rem)/7.6)] font-black leading-[0.85] tracking-[-0.045em] md:text-[min(calc((100vw-4rem)/6.9),11.5rem)]"
            initial={{ y: "35%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            aria-hidden
          >
            {brand.name}
          </motion.p>
        </div>
      </section>

      <footer ref={ref} className="relative h-svh min-h-[40rem] overflow-hidden bg-wall [container-type:size]">
        <CoverStage set="stage">
          <div className="absolute left-[21%] top-[6.5%] h-[13%] w-[58%] animate-bulbs rounded-full bg-gold/10 mix-blend-screen" />
          <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="absolute bottom-[2%] left-[30%] w-[40%]" />
          <Confetti count={30} />
        </CoverStage>

        {[leftCurtain, rightCurtain].map((x, side) => (
          <motion.div key={side} className="absolute top-0 h-full w-1/2" style={{ x, [side ? "right" : "left"]: 0 }}>
            <Image
              src="/show/curtain.webp"
              alt=""
              fill
              unoptimized
              sizes="50vw"
              className="object-cover"
              style={{ transform: side ? "scaleX(-1)" : undefined }}
            />
          </motion.div>
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-[#0b1230] to-transparent" />

        <motion.div
          className="absolute bottom-0 left-1/2 w-[min(22rem,62vw)] -translate-x-1/2"
          initial={{ y: "100%" }}
          animate={{ y: shown ? "36%" : "100%" }}
          transition={{ type: "spring", stiffness: 110, damping: 11, delay: 0.5 }}
        >
          <SantaPuppet level={level} />
        </motion.div>

        <div className="absolute inset-0 flex items-start justify-center px-4 pt-[9svh] md:pt-[8svh]">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ y: "-60%", opacity: 0, rotate: -5 }}
            animate={shown ? { y: 0, opacity: 1, rotate: 0 } : { y: "-60%", opacity: 0, rotate: -5 }}
            transition={{ y: { type: "spring", stiffness: 150, damping: 13 }, opacity: { duration: 0.2 }, rotate: { type: "spring", stiffness: 60, damping: 5 } }}
            style={{ transformOrigin: "50% -30%" }}
          >
            <div className="relative rounded-felt bg-berry p-2.5">
              <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/45" />
              <div className="relative rounded-[1.3rem] bg-paper p-7 text-center md:p-10">
                <h2 className="font-display text-4xl font-black leading-[0.95] tracking-[-0.025em] text-berry md:text-[4.2rem]">{t("finaleTitle")}</h2>
                <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-ink">{t("finaleBody")}</p>
                <Link href="/new" className="btn-primary mt-7 text-lg">
                  {t("create")}
                </Link>
                <div className="mx-auto mt-7 flex max-w-sm flex-col items-center rounded-[1rem] bg-cream p-4 text-left">
                  <p className="label self-start">{t("haveCode")}</p>
                  <JoinCodeForm />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        {/* The page ends on the stage, so the footer's links ride along its bottom edge. */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-ink/70 px-5 py-3 text-sm text-snow/85 backdrop-blur-md md:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <p>
              © {new Date().getFullYear()} {brand.name}
            </p>
            <nav className="flex items-center gap-5 font-semibold">
              <Link href="/me" className="hover:text-snow">{tn("mySessions")}</Link>
              <a href={`mailto:${brand.contact}`} className="hover:text-snow">{t("contact")}</a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
