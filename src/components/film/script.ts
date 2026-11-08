import type { FilmSfx } from "@/lib/audio/engine";

export type LineKey =
  | "season"
  | "busiest"
  | "deadline"
  | "letters"
  | "look"
  | "elves"
  | "time" | "trying" | "reindeer" | "sleigh" | "factory" | "help" | "become" | "ready";
export type ClipId =
  | "village"
  | "home"
  | "walkWorkshop"
  | "workshop"
  | "walkStable"
  | "stable"
  | "factory"
  | "santa"
  | "finaleReveal"
  | "finaleParty";

/** How a clip takes over from the one before: a straight cut (the clips were rendered to join), a crossfade, or out of white. */
export type Entry = "cut" | "fade" | "white";

/** Something that happens `at` seconds into a clip: a subtitle line, a sound, or both. */
export type Cue = { at: number; line?: LineKey; sfx?: FilmSfx };
export type Clip = { id: ClipId; entry: Entry; cues: Cue[] };

/** The whole film, clip by clip. The last clip loops under the call to action. */
export const clips: Clip[] = [
  {
    id: "village",
    entry: "fade",
    cues: [
      { at: 0.2, sfx: "bells" },
      { at: 0.4, line: "season" },
      { at: 3.0, line: "busiest" },
      { at: 6.2, line: "deadline" },
    ],
  },
  { id: "home", entry: "cut", cues: [{ at: 0.5, line: "letters" }] },
  { id: "walkWorkshop", entry: "fade", cues: [{ at: 0.2, line: "look", sfx: "steps" }, { at: 3.2, sfx: "whoosh" }] },
  {
    id: "workshop",
    entry: "cut",
    cues: [
      { at: 0.4, line: "elves", sfx: "giggle" },
      { at: 4.6, line: "time", sfx: "tick" },
      { at: 9.3, sfx: "whoosh" },
      { at: 9.8, sfx: "splat" },
    ],
  },
  { id: "walkStable", entry: "white", cues: [{ at: 0.1, line: "trying", sfx: "steps" }] },
  {
    id: "stable",
    entry: "cut",
    cues: [
      { at: 0.5, line: "reindeer" },
      { at: 4.4, sfx: "sneeze" },
      { at: 6.6, line: "sleigh", sfx: "creak" },
      { at: 9.2, sfx: "pop" },
    ],
  },
  {
    id: "factory",
    entry: "fade",
    cues: [
      { at: 0.4, line: "factory" },
      { at: 5.7, sfx: "clank" },
      { at: 6.1, sfx: "sputter" },
    ],
  },
  { id: "santa", entry: "fade", cues: [{ at: 0.4, line: "help" }] },
  { id: "finaleReveal", entry: "fade", cues: [{ at: 0.8, line: "become" }, { at: 3.6, sfx: "sparkle" }] },
  { id: "finaleParty", entry: "cut", cues: [{ at: 0.2, line: "ready", sfx: "fanfare" }] },
];

export const lineKeys = clips.flatMap((c) => c.cues.flatMap((q) => (q.line ? [q.line] : [])));

/** Time a viewer needs to read a subtitle, for when Santa isn't heard. */
export const readingMs = (text: string) => 1100 + text.length * 58;

/** Where a clip's video and first frame live; phones held upright get the 9:16 cut. */
export const clipSrc = (id: ClipId, tall: boolean, ext: "mp4" | "jpg") => `/film/${id}${tall ? "-tall" : ""}.${ext}`;
