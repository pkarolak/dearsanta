"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  /** 0 = closed, 1 = wide open. Driven by voice amplitude. */
  mouth?: number;
  className?: string;
  mood?: "happy" | "wink";
};

/** Santa sculpted from soft "clay" gradients. Pure SVG, so it renders crisply on any screen. */
export function Santa({ mouth = 0, className, mood = "happy" }: Props) {
  const id = useId().replace(/:/g, "");
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => setBlink(false), 140);
          schedule();
        },
        2400 + Math.random() * 3200,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const open = Math.max(0, Math.min(1, mouth));
  const g = (name: string) => `url(#${id}-${name})`;
  const eyeScale = blink ? 0.1 : 1;

  return (
    <svg viewBox="0 0 400 460" className={className} role="img" aria-label="Santa Claus">
      <defs>
        <radialGradient id={`${id}-red`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#E0584F" />
          <stop offset="55%" stopColor="#B8332C" />
          <stop offset="100%" stopColor="#7E1F1B" />
        </radialGradient>
        <radialGradient id={`${id}-fur`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F4EEE6" />
          <stop offset="100%" stopColor="#D9CFC3" />
        </radialGradient>
        <radialGradient id={`${id}-skin`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FCE0CC" />
          <stop offset="65%" stopColor="#F0BC9E" />
          <stop offset="100%" stopColor="#D8967A" />
        </radialGradient>
        <radialGradient id={`${id}-nose`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F9B3A0" />
          <stop offset="100%" stopColor="#D9715F" />
        </radialGradient>
        <radialGradient id={`${id}-cheek`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F08A7A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#F08A7A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-gold`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F5D27A" />
          <stop offset="100%" stopColor="#B07D27" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3B1A10" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter={g("soft")}>
        {/* Body */}
        <path d="M60 460 C60 360 120 318 200 318 C280 318 340 360 340 460 Z" fill={g("red")} />
        <rect x="186" y="360" width="28" height="100" rx="12" fill={g("fur")} />
        <circle cx="200" cy="392" r="7" fill={g("gold")} />
        <circle cx="200" cy="428" r="7" fill={g("gold")} />

        {/* Beard */}
        <g fill={g("fur")}>
          <circle cx="200" cy="300" r="92" />
          <circle cx="128" cy="270" r="48" />
          <circle cx="272" cy="270" r="48" />
          <circle cx="150" cy="330" r="50" />
          <circle cx="250" cy="330" r="50" />
          <circle cx="200" cy="362" r="52" />
        </g>

        {/* Face */}
        <ellipse cx="200" cy="215" rx="82" ry="78" fill={g("skin")} />
        <ellipse cx="146" cy="236" rx="24" ry="17" fill={g("cheek")} />
        <ellipse cx="254" cy="236" rx="24" ry="17" fill={g("cheek")} />

        {/* Eyes */}
        <g style={{ transition: "transform 80ms" }}>
          <g transform={`translate(168 206) scale(1 ${eyeScale}) translate(-168 -206)`}>
            <ellipse cx="168" cy="206" rx="9" ry="11" fill="#2B1B14" />
            <circle cx="171" cy="202" r="3" fill="#fff" />
          </g>
          {mood === "wink" ? (
            <path d="M222 207 Q232 198 242 207" stroke="#2B1B14" strokeWidth="5" strokeLinecap="round" fill="none" />
          ) : (
            <g transform={`translate(232 206) scale(1 ${eyeScale}) translate(-232 -206)`}>
              <ellipse cx="232" cy="206" rx="9" ry="11" fill="#2B1B14" />
              <circle cx="235" cy="202" r="3" fill="#fff" />
            </g>
          )}
        </g>

        {/* Eyebrows */}
        <path d="M140 184 Q166 166 190 182 Q166 178 140 190 Z" fill={g("fur")} />
        <path d="M260 184 Q234 166 210 182 Q234 178 260 190 Z" fill={g("fur")} />

        {/* Mouth */}
        <ellipse cx="200" cy={276 + open * 6} rx={14 + open * 6} ry={3 + open * 15} fill="#5A1E1A" />
        <ellipse cx="200" cy={284 + open * 10} rx={8 + open * 3} ry={open * 5} fill="#D9655A" />

        {/* Mustache */}
        <path
          d="M200 252 C178 240 140 244 120 266 C142 280 176 280 200 264 C224 280 258 280 280 266 C260 244 222 240 200 252 Z"
          fill={g("fur")}
        />

        {/* Nose */}
        <ellipse cx="200" cy="238" rx="19" ry="16" fill={g("nose")} />
        <ellipse cx="194" cy="232" rx="6" ry="4" fill="#fff" opacity="0.55" />

        {/* Hat */}
        <path d="M112 160 C112 70 190 30 268 40 C320 46 350 90 352 150 C330 110 300 96 282 98 C300 120 292 150 288 160 Z" fill={g("red")} />
        <circle cx="350" cy="160" r="26" fill={g("fur")} />
        <rect x="100" y="140" width="200" height="44" rx="22" fill={g("fur")} />
      </g>
    </svg>
  );
}
