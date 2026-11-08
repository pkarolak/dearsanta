import Image from "next/image";
import type { ReactNode } from "react";
import layout from "./layout.json";

const sets = {
  home: "/show/set-living-room.webp",
  stage: "/show/set-stage.webp",
} as const;

export function Vignette({
  set,
  focus = "50% 50%",
  className = "",
  children,
  priority,
}: {
  set: keyof typeof sets;
  focus?: string;
  className?: string;
  children?: ReactNode;
  priority?: boolean;
}) {
  return (
    <div
      className={`${className.includes("absolute") ? "" : "relative"} overflow-hidden rounded-felt bg-wall [container-type:inline-size] ${className}`}
    >
      <Image
        src={sets[set]}
        alt=""
        fill
        unoptimized
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: focus }}
      />
      {children}
    </div>
  );
}

export function Cast({
  who,
  className,
  priority,
}: {
  who: "reindeer" | "elves" | "presents" | "stocking";
  className: string;
  priority?: boolean;
}) {
  const size = {
    reindeer: [864, 1152],
    elves: [900, 896],
    presents: [1280, 470],
    stocking: [420, 899],
  }[who];
  return (
    <Image
      src={`/show/${who}.webp`}
      alt=""
      width={size[0]}
      height={size[1]}
      unoptimized
      priority={priority}
      className={`pointer-events-none absolute h-auto select-none ${className}`}
    />
  );
}

const card = layout.reindeerCard;

/** The reindeer cutout with whatever it should hold laid over its blank card. */
export function Reindeer({ className, children }: { className: string; children?: ReactNode }) {
  return (
    <div className={`pointer-events-none absolute aspect-[3/4] ${className}`}>
      <Image src="/show/reindeer.webp" alt="" fill unoptimized sizes="40vw" className="object-contain" />
      <div
        className="absolute overflow-hidden rounded-[3%] bg-paper [container-type:inline-size]"
        style={{
          left: `${card.left - 0.6}%`,
          top: `${card.top - 0.4}%`,
          width: `${card.width + 1.2}%`,
          height: `${card.height + 0.8}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
