import type { VoiceLine } from "./engine";

/** Silence between two of Santa's lines. */
export const LINE_PAUSE_S = 0.5;

/** How long a line takes: its recording's real length, or a guess from the text before it's recorded. */
export const lineSeconds = (line: Pick<VoiceLine, "text" | "seconds">) => line.seconds ?? 0.9 + line.text.length * 0.068;

/** How long a whole chapter of Santa's script takes, pauses included. */
export const chapterSeconds = (lines: Pick<VoiceLine, "text" | "seconds">[]) =>
  lines.reduce((sum, line) => sum + lineSeconds(line) + LINE_PAUSE_S, 0);
