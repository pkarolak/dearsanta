"use client";

import { useEffect, useRef, useState } from "react";
import { workshopAudio, type VoiceLine } from "@/lib/audio/engine";

const estimateSeconds = (line: VoiceLine) => 0.9 + line.text.length * 0.068;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Plays a chapter of Santa's script in order. Devices that join late skip ahead to where the
 * chapter should be by now, so every screen hears roughly the same sentence at the same time.
 *
 * `chapter` names the chapter (the step and when the server started it). Only a new chapter restarts
 * the voice: state refreshes, a nudged clock offset or a new name further down the script never do.
 */
export function useVoice(
  lines: VoiceLine[] | null,
  chapter: string,
  startedAtLocal: number,
  enabled: boolean,
  lang: string,
  onFinished?: () => void,
) {
  const [playing, setPlaying] = useState<{ chapter: string; index: number } | null>(null);
  const linesRef = useRef(lines);
  const startRef = useRef(startedAtLocal);
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    linesRef.current = lines;
    startRef.current = startedAtLocal;
    finishedRef.current = onFinished;
  });
  const ready = !!lines?.length;

  useEffect(() => {
    const script = linesRef.current;
    if (!enabled || !script?.length) return;
    const audio = workshopAudio();
    let cancelled = false;
    script.forEach((l) => audio.prefetch(l.audioUrl));

    (async () => {
      let elapsed = Math.max(0, (Date.now() - startRef.current) / 1000);
      let i = 0;
      while (i < script.length && elapsed > estimateSeconds(script[i])) {
        elapsed -= estimateSeconds(script[i]);
        i++;
      }
      for (; i < script.length && !cancelled; i++) {
        // The newest wording of the line, in case a name changed while Santa was talking.
        const line = linesRef.current?.[i] ?? script[i];
        setPlaying({ chapter, index: i });
        await audio.speak(line, lang, elapsed > 1.5 ? elapsed : 0);
        elapsed = 0;
        if (!cancelled) await pause(500);
      }
      if (!cancelled) {
        setPlaying({ chapter, index: script.length });
        finishedRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      audio.stopVoice();
    };
  }, [chapter, enabled, ready, lang]);

  const index = enabled && playing?.chapter === chapter ? playing.index : -1;
  const current = index >= 0 ? (lines?.[index] ?? null) : null;
  /** How far the chapter has got: -1 before it starts, `lines.length` once Santa is done. */
  return { current, index };
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
