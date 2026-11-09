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

/** A twinkling starry sky; stars thin out towards the bottom. */
export function Stars({ count = 70, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const size = fix(1 + noise(i, 11) * 2.2);
        return (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-[#fff6dc]"
            style={{
              left: `${fix(noise(i, 12) * 100)}%`,
              top: `${fix(noise(i, 13) ** 1.6 * 100)}%`,
              width: size,
              height: size,
              boxShadow: size > 2.4 ? "0 0 6px 1px rgb(255 240 200 / 0.8)" : undefined,
              animationDuration: `${fix(2 + noise(i, 14) * 4)}s`,
              animationDelay: `-${fix(noise(i, 15) * 4)}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Slow ribbons of northern lights, drawn with soft gradients instead of a photo. */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <div className="animate-aurora absolute left-[30%] top-[30%] h-[45%] w-[75%] -rotate-12 rounded-[50%] bg-[radial-gradient(closest-side,rgb(70_230_160/0.38),rgb(40_160_170/0.18)_55%,transparent)] blur-3xl" />
      <div className="animate-aurora absolute left-[72%] top-[22%] h-[38%] w-[55%] rotate-[18deg] rounded-[50%] bg-[radial-gradient(closest-side,rgb(150_110_230/0.3),rgb(60_200_170/0.14)_60%,transparent)] blur-3xl [animation-delay:-5s] [animation-duration:13s]" />
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
