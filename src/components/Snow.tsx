"use client";

import { useEffect, useRef } from "react";

type Flake = { x: number; y: number; r: number; speed: number; drift: number; phase: number };

export function Snow({ density = 0.00012, className }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flakes: Flake[] = [];
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(width * height * density);
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 2.6,
        speed: 0.25 + Math.random() * 0.8,
        drift: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      frame++;
      for (const f of flakes) {
        if (!reduced) {
          f.y += f.speed * (0.6 + f.r / 3);
          f.x += Math.sin(frame / 90 + f.phase) * f.drift * 0.4;
          if (f.y > height + 4) {
            f.y = -4;
            f.x = Math.random() * width;
          }
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.35 + f.r / 6})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={ref} className={className ?? "pointer-events-none absolute inset-0 h-full w-full"} aria-hidden />;
}
