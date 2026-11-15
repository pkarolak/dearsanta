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

const board = layout.reindeerBoard;
const onBoard = (grow = 0) => ({
  left: `${board.left - grow}%`,
  top: `${board.top - grow}%`,
  width: `${board.width + grow * 2}%`,
  height: `${board.height + grow * 2}%`,
  transform: `rotate(${board.rotate}deg)`,
  transformOrigin: "0 0",
});

/** The reindeer cutout with whatever it should hold written onto its board. */
export function Reindeer({ className, children }: { className: string; children?: ReactNode }) {
  return (
    <div className={`pointer-events-none absolute aspect-[3/4] [isolation:isolate] ${className}`}>
      {/* The cutout's board is see-through, so a solid surface goes under it, tucked beneath the frame. */}
      <div
        className="absolute bg-[radial-gradient(120%_90%_at_35%_30%,#fffdf8_0%,#f7f1e6_70%,#ece2d2_100%)]"
        style={onBoard(0.8)}
      />
      <Image src="/show/reindeer.webp" alt="" fill unoptimized sizes="40vw" className="object-contain" />
      {children && (
        <div className="absolute mix-blend-multiply [container-type:inline-size]" style={onBoard()}>
          <div className="h-full opacity-[0.93] [filter:blur(0.1px)]">{children}</div>
          {/* The frame's lip shades the top and left edge of the board. */}
          <div className="absolute inset-0 shadow-[inset_0_1.8cqw_1.8cqw_-1.2cqw_rgba(80,45,20,0.32),inset_1.4cqw_0_1.6cqw_-1.2cqw_rgba(80,45,20,0.18)]" />
        </div>
      )}
    </div>
  );
}
