"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useSyncExternalStore } from "react";
import { SantaPuppet } from "../show/SantaPuppet";
import { Stocking } from "../show/Stocking";
import { Reindeer } from "../show/Vignette";
import { Caption } from "./Caption";
import { CoverStage } from "./CoverStage";
import { seededAvatar } from "@/lib/avatar";

export const demoElves = ["Anna", "Tom", "Ola", "Kasia", "Marek", "Ben"].map((name) => ({ name, avatar: seededAvatar(name.toLowerCase()) }));

const span = 38;
const slot = Math.min(5.6, span / demoElves.length);
const width = Math.min(5.2, slot * 0.92);
const start = 7 + (span - slot * demoElves.length) / 2;

const noSubscribe = () => () => {};

export function GatherScene() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const focus = useTransform(p, [0.04, 0.4, 0.62, 0.9], [0.1, 0.28, 0.5, 0.9]);
  const reindeerX = useTransform(p, [0.5, 0.66], ["120%", "0%"]);
  const reindeerTilt = useTransform(p, [0.5, 0.7], [10, 0]);
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");

  return (
    <section ref={ref} className="relative h-[320svh] bg-wall">
      <div className="sticky top-0 h-svh overflow-hidden [container-type:size]">
        <CoverStage set="home" focusX={focus}>
          {demoElves.map((e, i) => (
            <StockingPop key={e.name} index={i} progress={p} name={e.name} avatar={e.avatar} />
          ))}

          <div className="absolute left-[31%] top-[23%] w-[34%]">
            <div className="animate-sway [animation-duration:5s]" style={{ transformOrigin: "50% 100%" }}>
              <SantaPuppet />
            </div>
          </div>
          <Image src="/show/presents.webp" alt="" width={1280} height={470} unoptimized className="absolute -bottom-[2%] left-[21%] w-[54%]" />

          <motion.div className="absolute left-[68%] top-[13%] w-[29%]" style={{ x: reindeerX, rotate: reindeerTilt }}>
            <Reindeer className="relative! w-full">
              <div className="flex h-full items-center gap-[4cqw] p-[5cqw]">
                {origin && (
                  <QRCodeSVG
                    value={origin}
                    className="aspect-square h-[84%] w-auto shrink-0"
                    fgColor="#2b1810"
                    bgColor="#fffdf8"
                    marginSize={0}
                  />
                )}
                <p className="font-display text-[8cqw] font-bold leading-[1.05] text-ink">{t("scan")}</p>
              </div>
            </Reindeer>
            <Image
              src="/show/presents.webp"
              alt=""
              width={1280}
              height={470}
              unoptimized
              className="absolute -bottom-[30%] -left-[10%] w-[125%] max-w-none -scale-x-100"
            />
          </motion.div>
        </CoverStage>
        <Caption title={t("gatherTitle")} body={t("gatherBody")} />
      </div>
    </section>
  );
}

function StockingPop({
  index,
  progress,
  name,
  avatar,
}: {
  index: number;
  progress: MotionValue<number>;
  name: string;
  avatar: ReturnType<typeof seededAvatar>;
}) {
  const t0 = 0.06 + index * 0.065;
  const opacity = useTransform(progress, [t0, t0 + 0.03], [0, 1]);
  const y = useTransform(progress, [t0, t0 + 0.06], ["-45%", "0%"]);
  const rotate = useTransform(progress, [t0, t0 + 0.04, t0 + 0.08], [-14, 6, 0]);
  return (
    <motion.div
      className="absolute"
      style={{ left: `${start + slot * index + (slot - width) / 2}%`, top: "27.6%", width: `${width}%`, opacity, y, rotate, transformOrigin: "50% 0%" }}
    >
      <div className="animate-sway" style={{ animationDelay: `${-index * 0.7}s` }}>
        <Stocking name={name} avatar={avatar} index={index} />
      </div>
    </motion.div>
  );
}
