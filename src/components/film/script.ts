import type { FilmSfx } from "@/lib/audio/engine";

export type LineKey = "worry" | "elves" | "time" | "trying" | "reindeer" | "sleigh" | "factory" | "help" | "become" | "ready";
export type ShotId = "village" | "home" | "walkWorkshop" | "workshop" | "walkStable" | "stable" | "factory" | "santa" | "finale";
export type Transition = "fade" | "zoom" | "whip" | "iris";

/** One subtitle line, or a silent moment. `ms` is the least time it stays on screen. */
export type Beat = { line?: LineKey; ms: number; sfx?: FilmSfx };
export type Shot = { id: ShotId; enter: Transition; beats: Beat[] };

/** The whole film. The last beat has no end: the film rests on the call to action. */
export const shots: Shot[] = [
  { id: "village", enter: "fade", beats: [{ ms: 4600, sfx: "bells" }] },
  { id: "home", enter: "zoom", beats: [{ line: "worry", ms: 5200 }] },
  { id: "walkWorkshop", enter: "fade", beats: [{ ms: 2600, sfx: "steps" }] },
  { id: "workshop", enter: "zoom", beats: [{ line: "elves", ms: 5600, sfx: "giggle" }, { line: "time", ms: 5000 }] },
  { id: "walkStable", enter: "fade", beats: [{ line: "trying", ms: 5400, sfx: "steps" }] },
  { id: "stable", enter: "zoom", beats: [{ line: "reindeer", ms: 4200 }, { line: "sleigh", ms: 3800 }] },
  { id: "factory", enter: "whip", beats: [{ line: "factory", ms: 6400, sfx: "whoosh" }] },
  { id: "santa", enter: "iris", beats: [{ line: "help", ms: 3600 }] },
  { id: "finale", enter: "zoom", beats: [{ line: "become", ms: 5600, sfx: "sparkle" }, { line: "ready", ms: 5600, sfx: "fanfare" }, { ms: Infinity }] },
];

export const lineKeys = shots.flatMap((s) => s.beats.flatMap((b) => (b.line ? [b.line] : [])));

/** Time a viewer needs to read a subtitle, for when Santa isn't heard. */
export const readingMs = (text: string) => 1100 + text.length * 58;

/** Shots where Santa is on screen and his mouth should move with the narration. */
export const santaOnScreen: ShotId[] = ["home", "santa", "finale"];
