"use client";

import { useEffect, useRef, useState } from "react";
import { continueCeremonyAction } from "@/lib/actions";
import { chapterSeconds } from "@/lib/audio/timing";
import { stepEnds } from "@/lib/ceremony/steps";
import type { SessionState } from "@/lib/state";

/** Grace after Santa's chapter, for screens and remote phones that started it a moment late. */
const CHAPTER_GRACE_S = 2;
/** If the show hasn't carried on by itself this long after Santa finished, the chief gets a button for it. */
const STUCK_AFTER_MS = 6000;

/**
 * Seconds until Santa finishes the current chapter, so nobody cuts him off mid-sentence (remote elves
 * hear him a moment later than the room). Zero in the lobby, where nobody waits for him.
 */
export function useSantaLeft(state: SessionState | null, serverToLocal: (ms: number) => number) {
  const [now, setNow] = useState(() => Date.now());
  const script = state?.session.mode === "sync" && state.session.step !== "lobby" ? state.script : null;
  const endsAt = script?.length ? serverToLocal(state!.session.stepStartedAt) + (chapterSeconds(script) + CHAPTER_GRACE_S) * 1000 : 0;
  useEffect(() => {
    if (endsAt + STUCK_AFTER_MS <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [endsAt]);
  return { left: Math.max(0, Math.ceil((endsAt - now) / 1000)), stuck: now >= endsAt + STUCK_AFTER_MS };
}

/**
 * Carries the ceremony on wherever Santa doesn't wait for an answer: after the elves and the draw, and
 * once every elf has unwrapped their result. Runs on the big screen and the chief's devices alike.
 */
export function useAutopilot(
  code: string,
  state: SessionState | null,
  santaLeft: number,
  refresh: () => Promise<void> | void,
  screenKey?: string | null,
) {
  const step = state?.session.step;
  const end = step ? stepEnds[step] : null;
  const progress = state?.revealProgress;
  const everyoneUnwrapped = !!progress && progress.total > 0 && progress.revealed >= progress.total;
  const due = state?.session.mode === "sync" && santaLeft === 0 && (end === "auto" || (end === "reveal" && everyoneUnwrapped));
  const chapter = `${step}@${state?.session.stepStartedAt}`;
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!due || !step || done.current === chapter) return;
    done.current = chapter;
    void continueCeremonyAction(code, step, screenKey).then(() => refresh());
  }, [due, chapter, step, code, screenKey, refresh]);
}
