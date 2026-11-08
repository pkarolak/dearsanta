"use client";

import { useEffect, useState } from "react";

const hoHoHo = [0.7, 0.25, 0.8, 0.2, 0.75, 0.15, 0, 0, 0.6, 0.3, 0.7, 0.1, 0.65, 0.2, 0.55, 0];

/** Moves Santa's mouth through a short "ho, ho, ho" every time `trigger` changes to a truthy value. */
export function useHoHo(trigger: unknown, delay = 0) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let frame = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setLevel(hoHoHo[frame] ?? 0);
        frame++;
        if (frame > hoHoHo.length) clearInterval(interval);
      }, 120);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [trigger, delay]);
  return level;
}
