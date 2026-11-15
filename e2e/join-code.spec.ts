import { expect, test } from "@playwright/test";

const shots = "e2e/screens";

test("a guest lands on the home page and joins with the code from the organiser", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await host.goto("/en/new");
  await host.getByRole("button", { name: /A live draw, together/ }).click();
  await host.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = host.url().match(/\/s\/([A-Z0-9]{6})\//)![1];

  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors: string[] = [];
  guest.on("pageerror", (e) => errors.push(e.message));
  await guest.goto("/en");
  await guest.getByRole("button", { name: "Join", exact: true }).first().click();
  const panel = guest.locator("#join-panel");
  const field = panel.getByRole("textbox", { name: "Session code" });
  await expect(field).toBeFocused();

  await field.fill("ZZZZZZ");
  await panel.getByRole("button", { name: "Join", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveText(/We don’t know that code/);
  await guest.screenshot({ path: `${shots}/17-join-code.png` });

  await field.fill(`https://example.com/en/join/${code.toLowerCase()}`);
  await expect(field).toHaveValue(code);
  await panel.getByRole("button", { name: "Join", exact: true }).click();
  await guest.waitForURL(new RegExp(`/join/${code}$`));

  // A hairstyle and skin without a finished hat portrait: that hat is crossed out.
  await guest.fill("#name", "Ola");
  await guest.getByRole("button", { name: "Knock on the workshop door" }).click();
  await guest.waitForURL(new RegExp(`/s/${code}/me`));
  await expect(guest.locator("#elf-name")).toHaveValue("Ola");
  await guest.screenshot({ path: `${shots}/19-elf-intro.png` });
  await guest.getByRole("radio", { name: "Man", exact: true }).click();
  await guest.getByRole("button", { name: "Messy blond" }).click();
  await guest.getByRole("button", { name: "#E8B896" }).click();
  await guest.getByRole("group", { name: "Hat" }).getByRole("button", { name: "None" }).click();
  await expect(guest.getByRole("button", { name: "Santa hat" })).toBeDisabled();
  await expect(guest.getByRole("button", { name: "Beanie" })).toBeDisabled();
  await expect(guest.getByRole("button", { name: "Elf hat" })).toBeEnabled();
  await expect(guest.getByText(/A crossed-out hat doesn’t fit/)).toBeVisible();
  await expect(guest.locator('img[src*="elf-tousled-1-none"]').first()).toBeVisible();
  await guest.getByRole("button", { name: "Santa hat" }).scrollIntoViewIfNeeded();
  await guest.waitForTimeout(400);
  await guest.screenshot({ path: `${shots}/18-hat-missing.png` });
  expect(errors).toEqual([]);
});

test("each way to draw on the home page starts that kind of session", async ({ page }) => {
  await page.goto("/en");
  const card = page.getByRole("button", { name: /A fully remote draw/ });
  await expect(card).toContainText("Start");
  await card.click();
  // A remote draw asks a few questions first, in a step-by-step wizard.
  await page.waitForURL(/\/new\/remote/);
  await expect(page.getByRole("heading", { name: "Who are you celebrating with?" })).toBeVisible();
});
