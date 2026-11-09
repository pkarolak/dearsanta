"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { Cast, Reindeer, Vignette } from "../show/Vignette";
import { StringLights } from "./Atmosphere";

const modes = ["sync", "hybrid", "async"] as const;

export function ModesScene() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(2, Math.floor(v * 3))));

  const jump = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((el.offsetHeight - window.innerHeight) * (i + 0.5)) / 3, behavior: "smooth" });
  };

  return (
    <section ref={ref} className="relative h-[300svh] bg-[#1c0c0b] text-snow">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_70%_at_72%_55%,rgb(160_40_40/0.55),transparent_70%),radial-gradient(45%_60%_at_15%_70%,rgb(29_90_58/0.35),transparent_70%)]"
        />
        <div aria-hidden className="felt-texture absolute inset-0 opacity-60" />
        <StringLights swags={5} perSwag={6} sag={30} className="opacity-90" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 md:grid-cols-[5fr_7fr] md:gap-14 md:px-8">
          <div className="relative order-2 md:order-1">
            <h2 className="foil font-display text-4xl font-black leading-[1.02] tracking-[-0.025em] md:text-[clamp(2.8rem,4.4vw,4.6rem)]">
              {t("modesTitle")}
            </h2>
            <ul className="mt-6 space-y-1 md:mt-10 md:space-y-3">
              {modes.map((m, i) => (
                <li key={m}>
                  <button
                    onClick={() => jump(i)}
                    aria-current={active === i}
                    className={`w-full rounded-[1rem] py-2 text-left transition-colors md:py-3 ${active === i ? "text-snow" : "text-snow/40 hover:text-snow/70"}`}
                  >
                    <span className="block font-display text-2xl font-bold md:text-3xl">{t(`modes.${m}.title`)}</span>
                    <AnimatePresence initial={false}>
                      {active === i && (
                        <motion.span
                          className="block overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                        >
                          <span className="block pt-2 text-base leading-relaxed text-snow/85 md:text-lg">{t(`modes.${m}.body`)}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="gilt relative order-1 aspect-[4/3] max-h-[42svh] w-full overflow-hidden rounded-felt md:order-2 md:max-h-none">
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <ModePicture mode={modes[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModePicture({ mode }: { mode: (typeof modes)[number] }) {
  if (mode === "sync")
    return (
      <Vignette set="stage" focus="50% 40%" className="absolute! inset-0 rounded-none">
        <SantaPuppet className="absolute left-[31%] top-[14%] w-[38%]" />
        <Cast who="presents" className="-bottom-[6%] left-[20%] w-[60%]" />
      </Vignette>
    );
  if (mode === "hybrid")
    return (
      <Vignette set="home" focus="88% 50%" className="absolute! inset-0 rounded-none">
        <Reindeer className="left-[29%] top-[3%] w-[42%]">
          <Vignette set="stage" focus="50% 45%" className="absolute inset-[5%] rounded-[4cqw]">
            <SantaPuppet className="absolute left-[30%] top-[12%] w-[40%]" />
          </Vignette>
        </Reindeer>
      </Vignette>
    );
  return (
    <div className="absolute inset-0">
      <Image src="/home/mantel.webp" alt="" fill unoptimized sizes="60vw" className="object-cover" />
      <div className="animate-flicker absolute bottom-[-8%] left-[38%] h-[30%] w-[24%] rounded-full bg-[radial-gradient(closest-side,rgb(255_170_60/0.55),transparent)] mix-blend-screen" />
    </div>
  );
}
