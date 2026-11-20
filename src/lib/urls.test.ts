import { describe, expect, it } from "vitest";
import { appOrigin } from "./urls";

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
