import Image from "next/image";
import type { CSSProperties } from "react";
import { avatarOptions, type AvatarConfig } from "@/lib/avatar";

type Props = { config: AvatarConfig; className?: string; title?: string };

const dir = "/avatars";
const hex = (color: string) => color.slice(1);

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

/**
 * An elf as a felt puppet, like the people in the film. The face is a finished portrait per skin and hair;
 * sweater colour, scarf, glasses and hat are layers cut to sit on every portrait (see design/tools/build-avatars.mjs).
 */
export function Avatar({ config: c, className = "", title }: Props) {
  const skin = avatarOptions.skin.indexOf(c.skin);
  const style = c.hairStyle;
  const hair = style === "bald" ? "bald" : `${style}-${avatarOptions.hairColor.indexOf(c.hairColor)}`;
  const hat = c.hat === "none" ? null : c.hat;
  const keep = hat ? `url(${dir}/keep-${style}-${hat}.webp)` : undefined;

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`relative isolate inline-block aspect-square overflow-hidden rounded-full align-middle ${className}`}
      style={{ background: c.background }}
    >
      <Layer
        name={`face-${skin}-${hair}`}
        style={keep ? { maskImage: keep, WebkitMaskImage: keep, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" } : undefined}
      />
      <Layer name={`sweater-${style}-${hex(c.sweater)}`} />
      {c.blush && (
        <span
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "radial-gradient(circle at 37% 64%, rgb(239 120 110 / 0.42) 0, transparent 7.5%), radial-gradient(circle at 63% 64%, rgb(239 120 110 / 0.42) 0, transparent 7.5%)",
          }}
        />
      )}
      {c.scarf !== "none" && <Layer name={`scarf-${hex(c.scarf)}`} />}
      {c.glasses === "round" && <Layer name="glasses" />}
      {hat && <Layer name={`hat-${style}-${hat}`} />}
    </span>
  );
}
