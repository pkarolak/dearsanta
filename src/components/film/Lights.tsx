import type { CSSProperties } from "react";
import type { sets } from "./FilmSet";

/** A light painted into a set: x and y in percent of the set, size in percent of its width. */
type Light = [x: number, y: number, size: number, colour?: string];
type Rig = { fires?: Light[]; candles?: Light[]; bulbs?: Light[]; windows?: Light[]; aurora?: boolean };

const warm = "255, 196, 110";
const bulbColours = ["255, 90, 80", "255, 210, 90", "110, 220, 130", "110, 170, 255", "255, 140, 220"];

const rigs: Partial<Record<keyof typeof sets, Rig>> = {
  village: {
    windows: [[46.2, 45.5, 6], [34.2, 63.4, 5], [49.8, 63.4, 5], [93.3, 66.5, 6]],
    bulbs: [[25.9, 50.9, 1.6], [28.3, 52.6, 1.6], [31.5, 55.2, 1.6], [36.1, 55.9, 1.6], [41, 55.9, 1.6], [44.9, 56.6, 1.6], [49.3, 56.6, 1.6], [52.7, 55.6, 1.6], [56.4, 50, 1.6], [61.7, 48.3, 1.6]],
    aurora: true,
  },
  home: {
    fires: [[24.4, 56, 9]],
    candles: [[8.3, 5, 1.8], [13.7, 4, 1.8], [17.1, 7.5, 1.8], [39.3, 5.5, 1.8], [42, 7.5, 1.8]],
    bulbs: [[59.5, 26, 1.8], [65, 14, 1.8], [62, 47, 1.8], [70, 34, 1.8], [74, 46, 1.8], [64.2, 51.5, 1.8], [73, 64, 1.8], [68, 54, 1.8], [80, 51, 1.8], [64, 3, 1.8]],
  },
  workshop: {
    fires: [[29.8, 55, 9]],
    candles: [[17, 18, 1.8], [20, 17, 1.8], [22.6, 20.5, 1.8], [39.5, 21, 1.8], [42, 21, 1.8]],
    bulbs: [[3, 7, 2.2], [11.2, 8.7, 2.2], [16.9, 6, 2.2], [40.8, 6, 2.2], [46.9, 7.8, 2.2], [52, 7.8, 2.2], [70.6, 7.8, 2.2], [77.1, 8.7, 2.2], [84, 5.2, 2.2], [90.3, 7.8, 2.2], [96.7, 7.8, 2.2]],
  },
  stable: {
    candles: [[40.8, 9.5, 5], [60, 12, 5], [9.6, 32.6, 3.6], [34.4, 33, 3.6]],
  },
  factory: {
    bulbs: [[2, 7, 2.4], [14.6, 7.8, 2.4], [20.8, 5.2, 2.4], [27.8, 8.7, 2.4], [34.2, 11.3, 2.4], [40.5, 10.4, 2.4], [46.9, 13, 2.4], [51, 13, 2.4], [54.7, 13, 2.4], [60, 13, 2.4], [81, 12.2, 2.4], [86.4, 7.8, 2.4], [92, 10.4, 2.4]],
  },
  stage: {
    bulbs: [
      ...[1.4, 6, 11.2, 16.6, 23.4, 29.8, 37.1, 44.4, 51.8, 59.6, 66.9, 73.7, 80.6, 86.9, 92.8, 98.1].map((x): Light => [x, 90, 2.6, warm]),
      ...[33, 39, 45, 51, 57, 63, 69].map((x, i): Light => [x, 10.5 - (i % 2) * 1.5, 3.2, warm]),
    ],
  },
};

const glow = (rgb: string, core = 0.9): CSSProperties => ({
  background: `radial-gradient(circle, rgba(${rgb}, ${core}) 0%, rgba(${rgb}, ${core * 0.35}) 35%, rgba(${rgb}, 0) 70%)`,
});

function place([x, y, size]: Light, scale = 1): CSSProperties {
  return { left: `${x}%`, top: `${y}%`, width: `${size * scale}%` };
}

/** Breathes life into the light sources painted into a set: flickering fires and candles, twinkling bulbs, drifting aurora. */
export function Lights({ set }: { set: keyof typeof sets }) {
  const rig = rigs[set];
  if (!rig) return null;
  const spot = "absolute block aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {rig.aurora &&
        [[24, 16, 34, "120, 255, 170"], [62, 22, 40, "110, 240, 200"], [80, 12, 26, "170, 140, 255"]].map(([x, y, size, rgb], i) => (
          <span
            key={`a${i}`}
            className={`${spot} animate-aurora aspect-[2.4/1]!`}
            style={{ ...place([x as number, y as number, size as number]), ...glow(rgb as string, 0.32), animationDelay: `${-i * 2.7}s`, animationDuration: `${9 + i * 2}s` }}
          />
        ))}
      {rig.fires?.flatMap((f, i) => [
        <span key={`fc${i}`} className={`${spot} animate-flicker opacity-60`} style={{ ...place(f, 4.2), ...glow("255, 150, 60", 0.32), animationDuration: "2.3s" }} />,
        <span key={`f${i}`} className={`${spot} animate-flicker`} style={{ ...place(f), ...glow("255, 186, 90"), animationDuration: "0.9s" }} />,
        <span key={`fh${i}`} className={`${spot} animate-flicker`} style={{ ...place([f[0], f[1] - 2, f[2] * 0.45]), ...glow("255, 236, 170"), animationDuration: "0.6s", animationDelay: "-0.3s" }} />,
      ])}
      {rig.candles?.map((c, i) => (
        <span key={`c${i}`} className={`${spot} animate-flicker`} style={{ ...place(c, 2.4), ...glow(warm, 0.75), animationDuration: `${0.8 + (i % 3) * 0.35}s`, animationDelay: `${-i * 0.37}s` }} />
      ))}
      {rig.windows?.map((w, i) => (
        <span key={`w${i}`} className={`${spot} animate-flicker`} style={{ ...place(w, 1.6), ...glow(warm, 0.45), animationDuration: `${3 + i * 0.7}s`, animationDelay: `${-i}s` }} />
      ))}
      {rig.bulbs?.map((b, i) => (
        <span
          key={`b${i}`}
          className={`${spot} animate-twinkle`}
          style={{ ...place(b, 2.2), ...glow(b[3] ?? bulbColours[i % bulbColours.length], 0.85), animationDuration: `${1.8 + ((i * 7) % 5) * 0.4}s`, animationDelay: `${-((i * 3) % 7) * 0.45}s` }}
        />
      ))}
    </div>
  );
}
