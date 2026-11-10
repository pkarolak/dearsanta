import { z } from "zod";

export const avatarOptions = {
  skin: ["#F5D3B8", "#E8B896", "#C98E68", "#9A6544", "#6B4430"],
  hair: ["waves", "braids", "bob", "puffs", "ponytail", "granny", "pixie", "bun", "short", "slick", "tousled", "grandpa", "curls", "quiff", "manbun"],
  facial: ["none", "moustache", "goatee", "beard"],
  hat: ["none", "santa", "elf", "beanie", "antlers"],
  glasses: ["none", "round"],
  sweater: ["#B3261E", "#2F5D46", "#1F3A5F", "#E7B54A", "#F4EFE6"],
  background: ["#F2D7C9", "#D7E6D3", "#D9E2F0", "#F3E4B9", "#E9D7EC"],
} as const;

export const avatarSchema = z.object({
  skin: z.enum(avatarOptions.skin),
  hair: z.enum(avatarOptions.hair),
  facial: z.enum(avatarOptions.facial),
  hat: z.enum(avatarOptions.hat),
  glasses: z.enum(avatarOptions.glasses),
  sweater: z.enum(avatarOptions.sweater),
  background: z.enum(avatarOptions.background),
  blush: z.boolean(),
});

export type AvatarConfig = z.infer<typeof avatarSchema>;

export const defaultAvatar: AvatarConfig = {
  skin: avatarOptions.skin[1],
  hair: "short",
  facial: "none",
  hat: "santa",
  glasses: "none",
  sweater: avatarOptions.sweater[0],
  background: avatarOptions.background[0],
  blush: true,
};

function pick<T>(items: readonly T[], seed: number) {
  return items[seed % items.length];
}

/** Hairstyles drawn with a man's brows; a starter elf with one of these sometimes gets facial hair too. */
const bearded = new Set<string>(["short", "slick", "tousled", "grandpa", "curls", "quiff", "manbun"]);

/** Deterministic starter avatar so every new elf looks a little different. */
export function seededAvatar(seedText: string): AvatarConfig {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const hair = pick(avatarOptions.hair, h >>> 3);
  return {
    skin: pick(avatarOptions.skin, h),
    hair,
    facial: bearded.has(hair) ? pick(avatarOptions.facial, h >>> 7) : "none",
    hat: pick(avatarOptions.hat, h >>> 9),
    glasses: (h >>> 15) % 4 === 0 ? "round" : "none",
    sweater: pick(avatarOptions.sweater, h >>> 18),
    background: pick(avatarOptions.background, h >>> 21),
    blush: true,
  };
}

export function parseAvatar(value: unknown, fallbackSeed = "elf"): AvatarConfig {
  const parsed = avatarSchema.safeParse(value);
  return parsed.success ? parsed.data : seededAvatar(fallbackSeed);
}
