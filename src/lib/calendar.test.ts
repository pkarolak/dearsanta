import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "./calendar";

const event = {
  uid: "abc",
  title: "Secret Santa, family",
  description: "Line one\nLine two; with semicolon",
  start: new Date("2026-12-20T18:00:00Z"),
  location: "Grandma's house",
};

describe("calendar", () => {
  it("builds a valid ics event", () => {
    const ics = buildIcs(event);
    expect(ics).toContain("DTSTART:20261220T180000Z");
    expect(ics).toContain("DTEND:20261220T190000Z");
    expect(ics).toContain("SUMMARY:Secret Santa\\, family");
    expect(ics).toContain("Line one\\nLine two\\; with semicolon");
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });

  it("builds a google calendar link", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get("dates")).toBe("20261220T180000Z/20261220T190000Z");
    expect(url.searchParams.get("location")).toBe("Grandma's house");
  });
});
