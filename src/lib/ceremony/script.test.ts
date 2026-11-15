import { describe, expect, it } from "vitest";
import { listFrame, nameTakes, spokenName } from "./script";

describe("pre-recorded names", () => {
  it("keeps one spelling per name", () => {
    expect(spokenName("  babcia   kasia ")).toBe("Babcia Kasia");
  });

  it("records every place a name can take in a list", () => {
    expect(nameTakes("pl", "zosia")).toEqual({ mid: "Zosia,", last2: "i Zosia.", last: "i Zosia.", solo: "Zosia." });
    expect(nameTakes("es", "Ignacio").last).toBe("e Ignacio.");
  });

  it("splits a list line into the fixed words around the names", () => {
    expect(listFrame("pl", "elvesNames")).toEqual({ before: "", after: "" });
    expect(listFrame("pl", "elvesRemote")).toEqual({
      before: "I serdeczne pozdrowienia dla tych, którzy są z nami z daleka:",
      after: "Świąteczna magia działa na każdą odległość.",
    });
  });
});
