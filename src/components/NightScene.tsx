"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Snow } from "./Snow";

const stars = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: ((i * 61.8) % 45) + 2,
  s: 1 + ((i * 7) % 3),
  d: (i % 7) * 0.4,
}));

/**
 * The workshop at night: layered hills, a glowing cabin and falling snow, with a gentle
 * parallax that follows the pointer.
 */
export function NightScene({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const layer = (depth: number) => ({
    transform: `translate3d(calc(var(--px, 0) * ${-depth}px), calc(var(--py, 0) * ${-depth / 2}px), 0)`,
    transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
  });

  return (
    <div
      ref={root}
      className={`relative isolate overflow-hidden bg-gradient-to-b from-night via-night-2 to-[#2b4a62] text-snow ${className}`}
    >
      <div className="absolute inset-0 -z-10" style={layer(8)} aria-hidden>
        {stars.map((s, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
          />
        ))}
        <div className="absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-[#fdf3d8] opacity-90 shadow-[0_0_80px_30px_rgba(253,243,216,0.25)]" />
      </div>

      <svg
        className="absolute inset-x-[-5%] bottom-0 -z-10 h-[46%] w-[110%]"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        aria-hidden
        style={layer(18)}
      >
        <path d="M0 220 C200 140 380 200 560 150 C760 96 960 170 1200 120 L1200 400 L0 400 Z" fill="#3c5d78" opacity="0.7" />
      </svg>

      <svg
        className="absolute inset-x-[-5%] bottom-0 -z-10 h-[38%] w-[110%]"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
        style={layer(30)}
      >
        <g fill="#1f3b33">
          {[90, 170, 980, 1060, 1130].map((x, i) => (
            <path key={x} d={`M${x} ${160 + (i % 2) * 30} l-38 110 h76 Z M${x} ${120 + (i % 2) * 30} l-28 80 h56 Z`} />
          ))}
        </g>
        <path d="M0 270 C240 210 420 250 640 230 C860 210 1000 260 1200 230 L1200 400 L0 400 Z" fill="#e9eef3" />
        <g transform="translate(760 150)">
          <path d="M0 60 L70 10 L140 60 Z" fill="#7a3b2a" />
          <path d="M-6 62 L70 6 L146 62 L140 70 L70 20 L0 70 Z" fill="#fdfaf6" />
          <rect x="14" y="60" width="112" height="70" rx="6" fill="#8e4a33" />
          <rect x="34" y="78" width="30" height="26" rx="5" fill="#ffc96b" className="animate-glow" />
          <rect x="82" y="84" width="26" height="46" rx="4" fill="#5b2b1f" />
          <rect x="104" y="0" width="14" height="34" fill="#6b3324" />
        </g>
        <ellipse cx="809" cy="300" rx="120" ry="18" fill="#ffd48a" opacity="0.18" />
      </svg>

      <Snow />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
