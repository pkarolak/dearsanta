"use client";

import Image from "next/image";
import layout from "./layout.json";

type Props = {
  /** Voice amplitude, 0 = silent, 1 = loud. Picks the mouth shape and drives the head bob. */
  level?: number;
  className?: string;
  priority?: boolean;
};

const box = layout.santaMouth;
const mouthStyle = { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` };

/** The felt hand-puppet Santa. Only the mouth patch changes while he talks, so nothing else jitters. */
export function SantaPuppet({ level = 0, className = "", priority }: Props) {
  const shape = level < 0.1 ? "closed" : level < 0.42 ? "half" : "open";
  const bob = Math.min(1, level);
  return (
    <div className={`${className.includes("absolute") ? "" : "relative"} aspect-[3/4] ${className}`}>
      <div
        className="absolute inset-0 origin-bottom transition-transform duration-75"
        style={{ transform: `translateY(${-bob * 1.6}%) rotate(${(bob - 0.3) * 1.4}deg)` }}
      >
        <Image src="/show/santa.webp" alt="Santa" fill sizes="(min-width: 1024px) 40vw, 70vw" priority={priority} unoptimized className="object-contain" />
        {(["half", "open"] as const).map((m) => (
          <Image
            key={m}
            src={`/show/santa-mouth-${m}.webp`}
            alt=""
            width={410}
            height={280}
            unoptimized
            priority={priority}
            className="absolute"
            style={{ ...mouthStyle, opacity: shape === m ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}
