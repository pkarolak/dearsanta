import { describe, expect, it } from "vitest";
import { listFrame, nameTakes, splitSentences, spokenName } from "./script";

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

describe("captions", () => {
  it("gives every sentence its own caption", () => {
    expect(splitSentences("Ho, ho, ho! Dobry wieczór, moi drodzy! To ja, Święty Mikołaj.")).toEqual([
      "Ho, ho, ho!",
      "Dobry wieczór, moi drodzy!",
      "To ja, Święty Mikołaj.",
    ]);
    expect(splitSentences("Ya está. ¿Listos para el sorteo?")).toEqual(["Ya está.", "¿Listos para el sorteo?"]);
  });

  it("keeps a trailing ellipsis and a mid-sentence colon in one caption", () => {
    expect(splitSentences("Koło fortuny przejmuje wielka skarpeta…")).toEqual(["Koło fortuny przejmuje wielka skarpeta…"]);
    expect(splitSentences("I najważniejsze: zachowajcie wynik w tajemnicy!")).toHaveLength(1);
  });
});
