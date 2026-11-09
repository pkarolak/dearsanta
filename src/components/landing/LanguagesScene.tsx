"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { useDepth, useSceneScroll } from "./useDepth";
import { useHoHo } from "./useHoHo";
import { Link } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

const greetings: Record<Locale, string> = {
  pl: "Ho, ho, ho! Wesołych Świąt!",
  en: "Ho, ho, ho! Merry Christmas!",
  de: "Ho, ho, ho! Frohe Weihnachten!",
  es: "¡Jo, jo, jo! ¡Feliz Navidad!",
  pt: "Ho, ho, ho! Feliz Natal!",
};

export function LanguagesScene() {
  const t = useTranslations("home");
  const current = useLocale() as Locale;
  const [hovered, setHovered] = useState<{ locale: Locale; n: number } | null>(null);
  const speaking = hovered?.locale ?? current;
  const level = useHoHo(hovered?.n);
  const ref = useRef<HTMLElement>(null);
  const p = useSceneScroll(ref);
  const room = useDepth(p, [0, 1], [-10, 10]);
  const duck = useDepth(p, [0.55, 0.9], [0, 75]);
  const gone = useDepth(p, [0.7, 0.88], [1, 0], "", 1);
  const hover = (locale: Locale) => setHovered((h) => (h?.locale === locale ? h : { locale, n: (h?.n ?? 0) + 1 }));

  return (
    <section
      ref={ref}
      className="relative z-10 overflow-hidden rounded-t-[2.5rem] bg-[#3a0d10] text-snow shadow-[0_-30px_60px_-10px_rgb(0_0_0/0.6)] md:rounded-t-[4rem]"
    >
      <motion.div className="absolute -inset-y-[12%] inset-x-0" style={{ y: room }}>
        <Image src="/home/study.webp" alt="" fill unoptimized sizes="100vw" className="object-cover object-[70%_60%]" />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgb(40_6_10/0.92)_0%,rgb(40_6_10/0.7)_38%,rgb(40_6_10/0.15)_65%,transparent_85%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-[#1c0c0b] via-[#1c0c0b]/60 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-24 md:grid-cols-[1.25fr_1fr] md:items-stretch md:px-8 md:pt-0">
        <div className="md:py-32">
          <h2 className="glow-text font-display text-4xl font-black leading-[0.98] tracking-[-0.025em] md:text-[clamp(2.8rem,4.4vw,4.6rem)]">
            {t("languagesTitle")}
          </h2>
          <p className="glow-text mt-5 max-w-md text-lg leading-relaxed text-snow/90">{t("languagesBody")}</p>
          <ul className="mt-10 md:mt-14">
            {locales.map((l, i) => (
              <motion.li
                key={l}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: i * 0.07 }}
              >
                <Link
                  href="/"
                  locale={l}
                  lang={l}
                  onMouseEnter={() => hover(l)}
                  onFocus={() => hover(l)}
                  aria-current={l === current ? "true" : undefined}
                  className={`inline-block font-display text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.98] tracking-[-0.035em] transition-[color,transform] duration-300 hover:translate-x-3 focus-visible:translate-x-3 ${
                    l === speaking ? "foil" : "glow-text text-snow/50 hover:text-snow"
                  }`}
                >
                  {localeNames[l]}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative mt-24 h-[19rem] md:mt-0 md:h-auto">
          <motion.div className="absolute inset-0" style={{ y: duck, opacity: gone }}>
            <motion.div
              className="absolute -bottom-[3rem] left-1/2 w-[min(24rem,78%)] -translate-x-1/2 md:-bottom-[4.5rem]"
              initial={{ y: "40%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 90, damping: 13 }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={speaking}
                  lang={speaking}
                  className="absolute bottom-[96%] left-1/2 z-10 w-max max-w-[min(22rem,90vw)] -translate-x-1/2 rounded-felt bg-snow px-6 py-4 text-center font-display text-2xl font-bold text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] md:text-3xl"
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  {greetings[speaking]}
                </motion.p>
              </AnimatePresence>
              <div className="drop-shadow-[0_0_40px_rgb(255_190_100/0.35)]">
                <SantaPuppet level={level} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1c0c0b] to-transparent" />
    </section>
  );
}
