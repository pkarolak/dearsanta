import { defineConfig } from "@playwright/test";

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  globalSetup: "./e2e/warmup.ts",
  /* Each spec drives several browsers against one dev server; more at once starves its live updates. */
  workers: 4,
  expect: { timeout: 15_000 },
  use: { baseURL, trace: "retain-on-failure" },
  /* A server of its own, never the everyday one on :3000: that one may carry a real Resend key, and the specs
     read every mail from the local inbox. Its own database and build folder keep the two from colliding. */
  webServer: {
    command: `npx next dev -p ${port}`,
    url: `${baseURL}/en`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      MAIL_TRANSPORT: "inbox",
      APP_URL: baseURL,
      PGLITE_DIR: ".data/pglite-e2e",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
