import { z } from "zod";

export const avatarOptions = {
  skin: ["#F5D3B8", "#E8B896", "#C98E68", "#9A6544", "#6B4430"],
  hairStyle: ["short", "long", "bun", "curly", "bald"],
  hairColor: ["#2B1D16", "#6B3F22", "#B5702E", "#E3C07A", "#C9CBD0", "#A8322D"],
  hat: ["none", "santa", "elf", "beanie", "antlers"],
  scarf: ["none", "#B3261E", "#2F5D46", "#E7B54A", "#F4EFE6"],
  glasses: ["none", "round"],
  sweater: ["#B3261E", "#2F5D46", "#1F3A5F", "#E7B54A", "#F4EFE6"],
  background: ["#F2D7C9", "#D7E6D3", "#D9E2F0", "#F3E4B9", "#E9D7EC"],
} as const;

export const avatarSchema = z.object({
  skin: z.enum(avatarOptions.skin),
  hairStyle: z.enum(avatarOptions.hairStyle),
  hairColor: z.enum(avatarOptions.hairColor),
  hat: z.enum(avatarOptions.hat),
  scarf: z.enum(avatarOptions.scarf),
  glasses: z.enum(avatarOptions.glasses),
  sweater: z.enum(avatarOptions.sweater),
  background: z.enum(avatarOptions.background),
  blush: z.boolean(),
});

export type AvatarConfig = z.infer<typeof avatarSchema>;

export const defaultAvatar: AvatarConfig = {
  skin: avatarOptions.skin[1],
  hairStyle: "short",
  hairColor: avatarOptions.hairColor[1],
  hat: "santa",
  scarf: avatarOptions.scarf[1],
  glasses: "none",
  sweater: avatarOptions.sweater[1],
  background: avatarOptions.background[0],
  blush: true,
};

function pick<T>(items: readonly T[], seed: number) {
  return items[seed % items.length];
}

/** Deterministic starter avatar so every new elf looks a little different. */
export function seededAvatar(seedText: string): AvatarConfig {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return {
    skin: pick(avatarOptions.skin, h),
    hairStyle: pick(avatarOptions.hairStyle, h >>> 3),
    hairColor: pick(avatarOptions.hairColor, h >>> 6),
    hat: pick(avatarOptions.hat, h >>> 9),
    scarf: pick(avatarOptions.scarf, h >>> 12),
    glasses: pick(avatarOptions.glasses, h >>> 15),
    sweater: pick(avatarOptions.sweater, h >>> 18),
    background: pick(avatarOptions.background, h >>> 21),
    blush: true,
  };
}

export function parseAvatar(value: unknown, fallbackSeed = "elf"): AvatarConfig {
  const parsed = avatarSchema.safeParse(value);
  return parsed.success ? parsed.data : seededAvatar(fallbackSeed);
}
