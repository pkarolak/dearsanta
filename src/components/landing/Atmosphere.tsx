import type { CSSProperties } from "react";

/** Deterministic 0..1 noise, so server and client render the same flakes and bulbs. */
const noise = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  // Math.sin differs in the last bits between engines, so keep only digits both agree on.
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
};
const fix = (n: number) => +n.toFixed(2);

/** Soft felt snowflakes drifting down over a scene, like the snow in the film. */
export function Snowfall({ count = 40, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const size = fix(3 + noise(i, 1) * 7);
        const near = size > 8;
        return (
          <span
            key={i}
            className="animate-snow absolute -top-4 rounded-full bg-snow"
            style={
              {
                left: `${fix(noise(i, 2) * 100)}%`,
                width: size,
                height: size,
                opacity: fix(0.35 + noise(i, 3) * 0.55),
                filter: near ? "blur(1.5px)" : undefined,
                animationDuration: `${fix(9 + noise(i, 4) * 12)}s`,
                animationDelay: `-${fix(noise(i, 5) * 20)}s`,
                "--drift": `${fix((noise(i, 6) - 0.4) * 10)}vw`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

const bulbColors = ["#ff5a4e", "#ffd25e", "#5fe08a", "#6cb8ff", "#ff7ad1", "#ffb347"];

/** A string of glowing coloured bulbs hung in sagging swags across the top of a scene. */
export function StringLights({ swags = 4, perSwag = 7, sag = 34, className = "" }: { swags?: number; perSwag?: number; sag?: number; className?: string }) {
  const w = 1000;
  const span = w / swags;
  const h = sag + 30;
  const wire = Array.from({ length: swags }, (_, s) => `M${s * span},6 Q${s * span + span / 2},${6 + sag * 2} ${(s + 1) * span},6`).join(" ");
  const bulbs = Array.from({ length: swags * perSwag }, (_, i) => {
    const s = Math.floor(i / perSwag);
    const t = ((i % perSwag) + 0.5) / perSwag;
    return { x: s * span + t * span, y: 6 + sag * 4 * t * (1 - t), i };
  });
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={wire} fill="none" stroke="#2a1a12" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map(({ x, y, i }) => {
        const color = bulbColors[i % bulbColors.length];
        return (
          <span
            key={i}
            className="animate-twinkle absolute h-[1.1vw] max-h-4 min-h-2 w-[0.75vw] min-w-1.5 max-w-3 -translate-x-1/2 rounded-b-full rounded-t-[40%]"
            style={{
              left: `${fix((x / w) * 100)}%`,
              top: `${fix((y / h) * 100)}%`,
              background: color,
              boxShadow: `0 0 10px 3px ${color}aa, 0 0 26px 8px ${color}44`,
              animationDuration: `${fix(1.8 + noise(i, 7) * 2)}s`,
              animationDelay: `-${fix(noise(i, 8) * 3)}s`,
            }}
          />
        );
      })}
    </div>
  );
}
