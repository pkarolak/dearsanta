import { chromium, type FullConfig } from "@playwright/test";

/* The dev server compiles each route on its first request. With several specs starting at once that first
   compile can outlast an assertion's timeout, so every route the specs touch is opened once up front. */
const routes = [
  "/en",
  "/pl",
  "/en/new",
  "/en/new/plan",
  "/pl/new/remote",
  "/en/join/WARMUP",
  "/en/login",
  "/en/me",
  "/tv",
  "/en/s/WARMUP/host",
  "/en/s/WARMUP/me",
  "/en/s/WARMUP/reveal",
  "/en/s/WARMUP/screen",
  "/api/s/WARMUP/events",
  "/api/s/WARMUP/state",
  "/api/s/WARMUP/ics",
  "/dev/mail",
];

export default async function warmup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const route of routes) {
    const waitUntil = route.startsWith("/api/") ? "commit" : "load";
    await page.goto(baseURL + route, { timeout: 120_000, waitUntil }).catch(() => {});
  }
  await browser.close();
}
