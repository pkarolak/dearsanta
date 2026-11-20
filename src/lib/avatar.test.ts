import { describe, expect, it } from "vitest";
import { defaultAvatar, parseAvatar, seededAvatar } from "./avatar";

describe("parseAvatar", () => {
  it("reads an object", () => {
    expect(parseAvatar({ ...defaultAvatar, hair: "pixie", hat: "elf" })).toMatchObject({ hair: "pixie", hat: "elf" });
  });

  it("reads an avatar stored as a json string", () => {
    const saved = { ...defaultAvatar, hair: "grandpa", hat: "beanie" };
    expect(parseAvatar(JSON.stringify(saved))).toMatchObject({ hair: "grandpa", hat: "beanie" });
  });

  it("falls back when the value is not an avatar", () => {
    expect(parseAvatar("nope", "elf")).toEqual(seededAvatar("elf"));
    expect(parseAvatar(null, "elf")).toEqual(seededAvatar("elf"));
  });
});
