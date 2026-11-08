import { expect, test } from "@playwright/test";
import { linkFromInbox } from "./inbox";

const shots = "e2e/screens";
const stamp = Date.now();
const hostEmail = `boss-${stamp}@example.com`;
const elves = [`kasia-${stamp}@example.com`, `marek-${stamp}@example.com`];

test("own-time session: invites, elf profiles, unlock and personal reveal", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  host.on("dialog", (d) => void d.accept());

  await host.goto("/pl/new");
  await host.fill("#hostName", "Basia");
  await host.fill("#hostEmail", hostEmail);
  await host.fill("#title", "Biuro 2026");
  await host.getByRole("button", { name: /Każdy w swoim czasie/ }).click();
  await host.locator("textarea").fill(elves.join(", "));
  await host.getByRole("button", { name: "Utwórz sesję" }).click();
  await host.waitForURL(/\/pl\/s\/[A-Z0-9]{6}\/host/);

  // Each invited elf follows the e-mail link and creates a profile, which earns a thank-you e-mail.
  const elfPages = [];
  for (const email of elves) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await page.goto(await linkFromInbox(page, email));
    await page.getByRole("button", { name: "Stwórz elfa" }).click();
    await expect(page.getByText("Zapisane!")).toBeVisible();
    elfPages.push(page);
  }
  await host.goto("/dev/mail");
  await expect(host.locator("a").filter({ hasText: String(stamp) }).filter({ hasText: "Dzięki za założenie profilu elfa!" })).toHaveCount(2);

  // The chief unlocks the draw; everyone is e-mailed straight away.
  await host.goBack();
  await host.getByRole("button", { name: "Odblokuj losowanie" }).click();
  await expect(host.getByText(/Po losowaniu\. 0 z 3/)).toBeVisible();

  const kasia = elfPages[0];
  await kasia.goto(await linkFromInbox(kasia, elves[0], /Już czas/));
  await kasia.waitForURL(/\/reveal/);
  await kasia.getByRole("button", { name: /Rozpal kominek/ }).click();
  await kasia.getByRole("button", { name: "Przejdź do wyniku" }).click();
  await expect(kasia.getByText("W tym roku robisz prezent dla")).toBeVisible();
  await expect(kasia.locator("p.text-gold")).toHaveText(/^(Basia|marek-\d+)$/);
  await kasia.screenshot({ path: `${shots}/08-async-reveal.png` });
});
