export const ceremonySteps = ["lobby", "welcome", "elves", "rules", "draw", "reveal", "farewell"] as const;
export type CeremonyStep = (typeof ceremonySteps)[number];

export function nextStep(step: CeremonyStep): CeremonyStep | null {
  const i = ceremonySteps.indexOf(step);
  return i >= 0 && i < ceremonySteps.length - 1 ? ceremonySteps[i + 1] : null;
}

export function stepIndex(step: CeremonyStep) {
  return ceremonySteps.indexOf(step);
}

/** Steps at or after which the participant's own result may be shown on their device. */
export function isRevealOpen(step: CeremonyStep) {
  return stepIndex(step) >= stepIndex("reveal");
}
