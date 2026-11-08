"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";

const sets = {
  home: "/show/set-living-room.webp",
  stage: "/show/set-stage.webp",
} as const;

type Props = {
  set: keyof typeof sets;
  /** Which horizontal point of the set stays in frame when the screen is narrower than 16:9 (0 = left edge, 1 = right). */
  focusX?: number | MotionValue<number>;
  scale?: MotionValue<number>;
  origin?: string;
  priority?: boolean;
  children?: ReactNode;
};

/**
 * A 16:9 set that covers its parent like `background-size: cover`, so every layer inside can be placed in
 * percentages of the set and stays glued to the scenery at any screen shape. The parent must be a size container.
 */
export function CoverStage({ set, focusX = 0.5, scale, origin = "50% 50%", priority, children }: Props) {
  const fallback = useMotionValue(typeof focusX === "number" ? focusX : 0.5);
  const fx = typeof focusX === "number" ? fallback : focusX;
  const left = useTransform(fx, (v) => `calc((100cqw - max(100cqw, 100cqh * 16 / 9)) * ${v})`);

  return (
    <motion.div
      className="@container absolute aspect-video"
      style={{
        width: "max(100cqw, calc(100cqh * 16 / 9))",
        top: "calc((100cqh - max(100cqh, 100cqw * 9 / 16)) / 2)",
        left,
        scale,
        transformOrigin: origin,
      }}
    >
      <Image src={sets[set]} alt="" fill unoptimized priority={priority} sizes="100vw" className="object-cover" />
      {children}
    </motion.div>
  );
}
