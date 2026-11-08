"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { Cast, Reindeer, Vignette } from "../show/Vignette";

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
    <section ref={ref} className="relative h-[300svh] bg-snow">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-5 md:grid-cols-[5fr_7fr] md:gap-14 md:px-8">
          <div className="relative order-2 md:order-1">
            <h2 className="font-display text-4xl font-black leading-[0.98] tracking-[-0.025em] md:text-[clamp(2.8rem,4.4vw,4.6rem)]">
              {t("modesTitle")}
            </h2>
            <ul className="mt-6 space-y-1 md:mt-10 md:space-y-3">
              {modes.map((m, i) => (
                <li key={m}>
                  <button
                    onClick={() => jump(i)}
                    aria-current={active === i}
                    className={`w-full rounded-[1rem] py-2 text-left transition-colors md:py-3 ${active === i ? "text-ink" : "text-muted/55 hover:text-muted"}`}
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
                          <span className="block pt-2 text-base leading-relaxed text-ink md:text-lg">{t(`modes.${m}.body`)}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative order-1 aspect-[4/3] max-h-[42svh] w-full overflow-hidden rounded-felt bg-wall md:order-2 md:max-h-none">
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
    <div className="absolute inset-0 bg-pine">
      <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/35" />
      <Cast who="stocking" className="left-[22%] top-[12%] w-[18%] -rotate-6 animate-sway" />
      <Cast who="stocking" className="left-[41%] top-[8%] w-[18%] hue-rotate-[125deg] saturate-[0.8] brightness-[0.85] animate-sway [animation-delay:-1s]" />
      <Cast who="stocking" className="left-[60%] top-[14%] w-[18%] rotate-6 hue-rotate-[28deg] saturate-[1.2] brightness-[1.15] animate-sway [animation-delay:-2s]" />
    </div>
  );
}
