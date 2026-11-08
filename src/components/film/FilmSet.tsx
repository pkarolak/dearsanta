"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Lights } from "./Lights";

export const sets = {
  village: "/show/film/village.webp",
  workshop: "/show/film/workshop.webp",
  stable: "/show/film/stable.webp",
  factory: "/show/film/factory.webp",
  home: "/show/set-living-room.webp",
  stage: "/show/set-stage.webp",
} as const;

/** Where the camera looks: a point of the set (0..1 across, 0..1 down) and how far it zooms in. */
export type Cam = { x: number; y: number; z: number };

type Props = {
  set: keyof typeof sets;
  /** The opening framing, then one framing per beat that the camera glides to while the beat plays. */
  cams: Cam[];
  /** Framings for portrait screens, which see only a slice of the set. Defaults to `cams`. */
  tallCams?: Cam[];
  beat: number;
  /** How long the current beat is expected to last, so the move ends with it. */
  beatMs: number;
  shake?: number;
  priority?: boolean;
  children?: ReactNode;
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * A 16:9 set that always covers the frame. The camera centres on the requested point as far as the set allows,
 * so no edge ever shows, and every layer inside is placed in percentages of the set.
 */
export function FilmSet({ set, cams: wideCams, tallCams, beat, beatMs, shake = 0, priority, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tall, setTall] = useState(false);
  const cams = tall && tallCams ? tallCams : wideCams;
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const x = useMotionValue(cams[0].x);
  const y = useMotionValue(cams[0].y);
  const z = useMotionValue(cams[0].z);
  const jolt = useMotionValue(0);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      w.set(el.clientWidth);
      h.set(el.clientHeight);
      setTall(el.clientWidth < el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  useEffect(() => {
    const target = cams[Math.min(beat + 1, cams.length - 1)];
    const seconds = Number.isFinite(beatMs) ? beatMs / 1000 : 6;
    const opts = reduced ? { duration: 0 } : { duration: seconds, ease: [0.45, 0, 0.25, 1] as const };
    const runs = [animate(x, target.x, opts), animate(y, target.y, opts), animate(z, target.z, opts)];
    return () => runs.forEach((r) => r.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, tall]);

  useEffect(() => {
    if (!shake || reduced) return;
    const run = animate(jolt, [0, -1, 1, -0.7, 0.6, -0.3, 0], { duration: 0.5 });
    return () => run.stop();
  }, [shake, reduced, jolt]);

  const transform = useTransform([w, h, x, y, z, jolt], ([vw, vh, cx, cy, s, j]: number[]) => {
    const base = Math.max(vw, (vh * 16) / 9);
    const W = base * s;
    const H = (W * 9) / 16;
    const left = clamp(vw / 2 - cx * W, vw - W, 0) + j * vw * 0.012;
    const top = clamp(vh / 2 - cy * H, vh - H, 0) + j * vh * 0.008;
    return `translate3d(${left}px, ${top}px, 0) scale(${s})`;
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden [container-type:size]">
      <motion.div
        className="@container absolute left-0 top-0 aspect-video origin-top-left will-change-transform"
        style={{ width: "max(100cqw, calc(100cqh * 16 / 9))", transform }}
      >
        <Image src={sets[set]} alt="" fill unoptimized priority={priority} sizes="100vw" className="object-cover" />
        <Lights set={set} />
        {children}
      </motion.div>
    </div>
  );
}

/** A cut-out puppet or prop, placed in percentages of the set. */
export function Cutout({ src, w, h, className = "", style }: { src: string; w: number; h: number; className?: string; style?: React.CSSProperties }) {
  return <Image src={src} alt="" width={w} height={h} unoptimized className={`block h-auto w-full select-none ${className}`} style={style} draggable={false} />;
}
