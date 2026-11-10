import Image from "next/image";
import type { CSSProperties } from "react";
import { avatarOptions, type AvatarConfig } from "@/lib/avatar";
import geometry from "@/lib/elfGeometry.json";

type Props = { config: AvatarConfig; className?: string; title?: string };

const dir = "/elves";
const eyes: Record<string, number[] | undefined> = geometry;

function Layer({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <Image
      src={`${dir}/${name}.webp`}
      alt=""
      fill
      unoptimized
      sizes="10rem"
      className="pointer-events-none select-none"
      style={style}
    />
  );
}

/** Moves a layer cut from one portrait onto another so both pairs of eyes line up. */
function fit(layer: string, portrait: string): CSSProperties | undefined {
  const from = eyes[layer], to = eyes[portrait];
  if (!from || !to) return undefined;
  const s = to[2] / from[2];
  return {
    transformOrigin: "0 0",
    transform: `translate(${(to[0] - s * from[0]) * 100}%, ${(to[1] - s * from[1]) * 100}%) scale(${s})`,
  };
}

/**
 * An elf as a felt puppet, like the people in the film. Every hairstyle, skin and hat is a finished portrait;
 * the sweater colour is multiplied onto its bleached knit, and facial hair and glasses are fitted to the eyes
 * (see design/tools/build-elves.mjs).
 */
export function Avatar({ config: c, className = "", title }: Props) {
  const skin = Math.max(0, avatarOptions.skin.indexOf(c.skin));
  const wanted = `${c.hair}-${skin}-${c.hat}`;
  const portrait = eyes[wanted] ? wanted : `${c.hair}-${skin}-none`;
  const [ex, ey, ed] = eyes[portrait] ?? [0.52, 0.51, 0.135];
  const sweater = `url(${dir}/sweater-${portrait}.webp)`;
  const cheek = (side: number) => `radial-gradient(circle at ${(ex + side * 0.78 * ed) * 100}% ${(ey + 0.95 * ed) * 100}%, rgb(239 120 110 / 0.42) 0, transparent ${ed * 52}%)`;

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`relative isolate inline-block aspect-square overflow-hidden rounded-full align-middle ${className}`}
      style={{ background: c.background }}
    >
      <Layer name={`elf-${portrait}`} />
      <span
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{ background: c.sweater, maskImage: sweater, WebkitMaskImage: sweater, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
      {c.blush && <span className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ background: `${cheek(-1)}, ${cheek(1)}` }} />}
      {c.facial !== "none" && <Layer name={`${c.facial}-${c.hair}`} style={fit(`${c.facial}-${c.hair}`, portrait)} />}
      {c.glasses === "round" && <Layer name={`glasses-${c.hair}`} style={fit(`glasses-${c.hair}`, portrait)} />}
    </span>
  );
}
