"use client";

import { useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { RefObject } from "react";

/** 0 as the scene's top enters the bottom of the viewport, 1 as its bottom leaves the top. */
export function useSceneScroll(ref: RefObject<HTMLElement | null>) {
  return useScroll({ target: ref, offset: ["start end", "end start"] }).scrollYProgress;
}

/**
 * Maps scene progress to a CSS value, for layers that move at their own depth as the page scrolls.
 * With reduced motion every layer stays at `rest`.
 */
export function useDepth(p: MotionValue<number>, at: number[], values: number[], unit = "%", rest = 0) {
  const reduced = useReducedMotion();
  return useTransform(p, (v) => {
    if (reduced) return `${rest}${unit}`;
    let i = 0;
    while (i < at.length - 2 && v > at[i + 1]) i++;
    const t = Math.min(1, Math.max(0, (v - at[i]) / (at[i + 1] - at[i])));
    return `${values[i] + (values[i + 1] - values[i]) * t}${unit}`;
  });
}
