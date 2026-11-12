"use client";

import { ArrowRight, DeviceMobile, Devices, Television } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { Cast, Reindeer, Vignette } from "../show/Vignette";
import { StringLights } from "./Atmosphere";
import { useDepth, useSceneScroll } from "./useDepth";
import { useQuickStart, type QuickKind } from "../useQuickStart";

const modes = ["sync", "hybrid", "async"] as const;
const starts: Record<(typeof modes)[number], { kind: QuickKind; needs: (typeof Television)[] }> = {
  sync: { kind: "together", needs: [Television, DeviceMobile] },
  hybrid: { kind: "remote", needs: [Devices] },
  async: { kind: "ownTime", needs: [DeviceMobile] },
};

export function ModesScene() {
  const t = useTranslations("home");
  const tq = useTranslations("create.quick");
  const { pick, pending, chosen, error } = useQuickStart();
  const ref = useRef<HTMLElement>(null);
  const scene = useSceneScroll(ref);
  const drop = useDepth(scene, [0.05, 0.3], [-110, 0]);
  const rise = [useDepth(scene, [0.05, 0.4], [18, 0]), useDepth(scene, [0.1, 0.45], [26, 0]), useDepth(scene, [0.15, 0.5], [34, 0])];

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#1c0c0b] pb-24 pt-24 text-snow md:pb-32 md:pt-28">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_45%,rgb(160_40_40/0.5),transparent_70%),radial-gradient(45%_60%_at_15%_60%,rgb(29_90_58/0.35),transparent_70%)]"
      />
      <div aria-hidden className="felt-texture absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#1c0c0b_0%,transparent_18%,transparent_80%,#1c0c0b_100%)]" />
      <motion.div className="absolute inset-x-0 top-0" style={{ y: drop }}>
        <StringLights swags={5} perSwag={6} sag={30} className="opacity-90" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <h2 className="foil mx-auto max-w-3xl text-balance text-center font-display text-4xl font-black leading-[1.02] tracking-[-0.025em] md:text-[clamp(2.8rem,4.4vw,4.6rem)]">
          {t("modesTitle")}
        </h2>
        <ul className="mt-12 grid gap-12 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-10">
          {modes.map((m, i) => {
            const { kind, needs } = starts[m];
            const busy = pending && chosen === kind;
            return (
              <motion.li key={m} style={{ y: rise[i] }} animate={{ opacity: chosen && chosen !== kind ? 0.45 : 1 }}>
                <button
                  type="button"
                  onClick={() => pick(kind)}
                  disabled={pending}
                  aria-busy={busy}
                  className="group block w-full text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait"
                >
                  <span className="block transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-0.6deg] group-disabled:translate-y-0 group-disabled:rotate-0">
                  <motion.span
                    className="gilt relative block aspect-[4/3] overflow-hidden rounded-felt"
                    initial={{ opacity: 0, rotate: i === 1 ? 0 : i ? 5 : -5, scale: 0.9 }}
                    whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ type: "spring", stiffness: 90, damping: 12, delay: i * 0.12 }}
                    style={{ transformOrigin: "50% -20%" }}
                  >
                    <ModePicture mode={m} />
                    {busy && (
                      <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-2xl font-bold text-snow">
                        <span className="animate-pulse">{tq("starting")}</span>
                      </span>
                    )}
                  </motion.span>
                  </span>
                  <span className="mt-6 block font-display text-2xl font-bold leading-tight group-hover:text-gold md:mt-7 md:text-[1.7rem]">
                    {t(`modes.${m}.title`)}
                  </span>
                  <span className="mt-3 block text-base leading-relaxed text-snow/80 md:text-lg">{t(`modes.${m}.body`)}</span>
                  <span className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="btn-primary px-5 py-2.5 text-base group-hover:bg-berry-dark">
                      {t("modesStart")}
                      <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-snow/10 px-3 py-1.5 text-sm font-semibold text-snow/90 ring-1 ring-snow/15">
                      {needs.map((Icon, n) => (
                        <Icon key={n} weight="bold" className="h-4 w-4 text-gold" />
                      ))}
                      {tq(`${kind}.needs`)}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
        {error && (
          <p role="alert" className="mx-auto mt-8 max-w-xl rounded-2xl bg-berry/30 px-4 py-3 text-center text-snow">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export function ModePicture({ mode }: { mode: (typeof modes)[number] }) {
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
      <Image src="/home/mantel.webp" alt="" fill unoptimized sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
      <div className="animate-flicker absolute bottom-[-8%] left-[38%] h-[30%] w-[24%] rounded-full bg-[radial-gradient(closest-side,rgb(255_170_60/0.55),transparent)] mix-blend-screen" />
    </div>
  );
}
