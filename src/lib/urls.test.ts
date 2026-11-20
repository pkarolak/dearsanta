import { describe, expect, it } from "vitest";
import { appOrigin, localePath, safeSessionNext } from "./urls";

describe("appOrigin", () => {
  it("uses a LAN APP_URL for local development", () => {
    expect(appOrigin({ APP_URL: "http://192.168.68.53:3000", NODE_ENV: "development" })).toBe("http://192.168.68.53:3000");
  });

  it("falls back to localhost only outside production", () => {
    expect(appOrigin({ NODE_ENV: "development" })).toBe("http://localhost:3000");
  });

  it("requires a public APP_URL in production", () => {
    expect(() => appOrigin({ VERCEL: "1", NODE_ENV: "production" })).toThrow(/APP_URL/);
    expect(() => appOrigin({ VERCEL: "1", APP_URL: "http://192.168.68.53:3000" })).toThrow(/APP_URL/);
    expect(() => appOrigin({ NODE_ENV: "production", APP_URL: "http://localhost:3000" })).toThrow(/APP_URL/);
    expect(appOrigin({ VERCEL: "1", APP_URL: "https://drogimikolaju.pl/" })).toBe("https://drogimikolaju.pl");
  });
});

describe("localePath", () => {
  it("keeps the screen key the locale router would drop", () => {
    expect(localePath("pl", "/s/AB12CD/screen?k=abc")).toBe("/pl/s/AB12CD/screen?k=abc");
  });
});

describe("safeSessionNext", () => {
  const code = "AB12CD";

  it("keeps this session's own pages", () => {
    expect(safeSessionNext(`/s/${code}/host`, code)).toBe(`/s/${code}/host`);
    expect(safeSessionNext(`/s/${code}/host?remote=1`, code)).toBe(`/s/${code}/host?remote=1`);
    expect(safeSessionNext(`/s/${code}/reveal`, code)).toBe(`/s/${code}/reveal`);
    expect(safeSessionNext(null, code)).toBe(`/s/${code}/me`);
  });

  it("drops external and escaped targets", () => {
    expect(safeSessionNext("https://evil.example", code)).toBe(`/s/${code}/me`);
    expect(safeSessionNext("//evil.example", code)).toBe(`/s/${code}/me`);
    expect(safeSessionNext(`/s/${code}/../../../../evil.example`, code)).toBe(`/s/${code}/me`);
    expect(safeSessionNext(`/s/${code}/host?next=https://evil.example`, code)).toBe(`/s/${code}/me`);
    expect(safeSessionNext(`/s/OTHER/host`, code)).toBe(`/s/${code}/me`);
  });
});
