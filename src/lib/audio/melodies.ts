/** Public-domain carols as [note, beats] pairs. Notes use scientific pitch notation. */
export type Melody = { title: string; bpm: number; notes: [string, number][] };

export const melodies: Melody[] = [
  {
    title: "Jingle Bells",
    bpm: 112,
    notes: [
      ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2],
      ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
      ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
      ["E4", 1], ["D4", 1], ["D4", 1], ["E4", 1], ["D4", 2], ["G4", 2],
      ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2],
      ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
      ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
      ["G4", 1], ["G4", 1], ["F4", 1], ["D4", 1], ["C4", 4], ["R", 2],
    ],
  },
  {
    title: "Silent Night",
    bpm: 84,
    notes: [
      ["G4", 1.5], ["A4", 0.5], ["G4", 1], ["E4", 3],
      ["G4", 1.5], ["A4", 0.5], ["G4", 1], ["E4", 3],
      ["D5", 2], ["D5", 1], ["B4", 3],
      ["C5", 2], ["C5", 1], ["G4", 3],
      ["A4", 2], ["A4", 1], ["C5", 1.5], ["B4", 0.5], ["A4", 1],
      ["G4", 1.5], ["A4", 0.5], ["G4", 1], ["E4", 3],
      ["A4", 2], ["A4", 1], ["C5", 1.5], ["B4", 0.5], ["A4", 1],
      ["G4", 1.5], ["A4", 0.5], ["G4", 1], ["E4", 3],
      ["D5", 2], ["D5", 1], ["F5", 1.5], ["D5", 0.5], ["B4", 1],
      ["C5", 3], ["E5", 3],
      ["C5", 1], ["G4", 1], ["E4", 1], ["G4", 1.5], ["F4", 0.5], ["D4", 1], ["C4", 6], ["R", 3],
    ],
  },
  {
    title: "We Wish You a Merry Christmas",
    bpm: 132,
    notes: [
      ["G4", 1],
      ["C5", 1], ["C5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 1], ["A4", 1],
      ["A4", 1], ["D5", 1], ["D5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 1], ["G4", 1],
      ["G4", 1], ["E5", 1], ["E5", 0.5], ["F5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 1], ["A4", 1],
      ["G4", 0.5], ["G4", 0.5], ["A4", 1], ["D5", 1], ["B4", 1], ["C5", 3], ["R", 3],
    ],
  },
  {
    title: "O Tannenbaum",
    bpm: 96,
    notes: [
      ["D4", 1], ["G4", 1.5], ["G4", 0.5], ["G4", 1.5], ["A4", 0.5], ["B4", 1.5], ["B4", 0.5], ["B4", 2],
      ["A4", 0.5], ["B4", 0.5], ["C5", 1], ["F#4", 1], ["A4", 1], ["G4", 2], ["R", 1],
      ["D5", 1], ["D5", 0.5], ["B4", 0.5], ["E5", 1.5], ["D5", 0.5], ["D5", 0.5], ["C5", 0.5], ["C5", 2],
      ["C5", 1], ["C5", 0.5], ["A4", 0.5], ["D5", 1.5], ["C5", 0.5], ["C5", 0.5], ["B4", 0.5], ["B4", 2], ["R", 2],
    ],
  },
];

/** Chord per bar of the Jingle Bells chorus (16 bars of 4 beats), for the film's full arrangement. */
export const jingleBellsChords = ["C", "C", "C", "C", "F", "C", "D7", "G7", "C", "C", "C", "C", "F", "C", "G7", "C"] as const;

/** Bass root and fifth, then the chord stab, per chord. */
export const chordVoicings: Record<(typeof jingleBellsChords)[number], { bass: [string, string]; stab: string[] }> = {
  C: { bass: ["C3", "G2"], stab: ["G3", "C4", "E4"] },
  F: { bass: ["F2", "C3"], stab: ["A3", "C4", "F4"] },
  D7: { bass: ["D3", "A2"], stab: ["F#3", "A3", "C4"] },
  G7: { bass: ["G2", "D3"], stab: ["B3", "D4", "F4"] },
};

const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

export function noteFrequency(note: string) {
  const match = /^([A-G])(#|b)?(\d)$/.exec(note);
  if (!match) return 0;
  const [, letter, accidental, octave] = match;
  const semis = SEMITONES[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0) + (Number(octave) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}
