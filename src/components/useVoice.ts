"use client";

import { useEffect, useRef, useState } from "react";
import { workshopAudio, type VoiceLine } from "@/lib/audio/engine";

const estimateSeconds = (line: VoiceLine) => 0.9 + line.text.length * 0.068;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Plays a chapter of Santa's script in order. Devices that join late skip ahead to where the
 * chapter should be by now, so every screen hears roughly the same sentence at the same time.
 */
export function useVoice(
  lines: VoiceLine[] | null,
  startedAtLocal: number,
  enabled: boolean,
  lang: string,
  onFinished?: () => void,
) {
  const [current, setCurrent] = useState<VoiceLine | null>(null);
  const key = `${lines?.map((l) => l.id + l.text).join("|")}@${startedAtLocal}@${enabled}`;
  const linesRef = useRef(lines);
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    linesRef.current = lines;
    finishedRef.current = onFinished;
  });

  useEffect(() => {
    const script = linesRef.current;
    if (!enabled || !script?.length) return;
    const audio = workshopAudio();
    let cancelled = false;
    script.forEach((l) => audio.prefetch(l.audioUrl));

    (async () => {
      let elapsed = Math.max(0, (Date.now() - startedAtLocal) / 1000);
      let i = 0;
      while (i < script.length && elapsed > estimateSeconds(script[i])) {
        elapsed -= estimateSeconds(script[i]);
        i++;
      }
      for (; i < script.length && !cancelled; i++) {
        setCurrent(script[i]);
        await audio.speak(script[i], lang, elapsed > 1.5 ? elapsed : 0);
        elapsed = 0;
        if (!cancelled) await pause(500);
      }
      if (!cancelled) {
        setCurrent(null);
        finishedRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      audio.stopVoice();
      setCurrent(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang]);

  return { current: enabled ? current : null };
}

/** Santa's mouth openness, sampled every animation frame while he speaks. */
export function useMouth(active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let smoothed = 0;
    const tick = () => {
      smoothed = smoothed * 0.55 + workshopAudio().level() * 0.45;
      setLevel(smoothed < 0.04 ? 0 : smoothed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return active ? level : 0;
}
