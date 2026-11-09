import { expect, test } from "@playwright/test";

const shots = "e2e/screens";

test("spontaneous: one tap into the waiting room, guests join with a name and dress up live", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();

  await host.goto("/en/new");
  await host.waitForTimeout(900);
  await host.screenshot({ path: `${shots}/10-mode-picker.png` });
  await host.getByRole("button", { name: /Together in one room/ }).click();
  await host.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = host.url().match(/\/s\/([A-Z0-9]{6})\//)![1];
  await expect(host.getByTestId("room-code")).toHaveText(code);
  await expect(host.getByText("Waiting for the first elves…")).toBeVisible();

  // Ola scans the code and only types her name; the door opens by itself.
  await guest.goto(`/en/join/${code}`);
  await expect(guest.getByLabel("Your e-mail (optional)")).toBeVisible();
  await guest.fill("#name", "Ola");
  await guest.getByRole("button", { name: "Knock on the workshop door" }).click();
  await guest.waitForURL(new RegExp(`/s/${code}/me`));
  await expect(guest.getByRole("heading", { name: "Create your elf" })).toBeVisible();

  // Every tweak shows up for the room before she saves anything.
  await guest.getByRole("button", { name: "Antlers" }).click();
  await expect(host.getByText("2 elves inside")).toBeVisible({ timeout: 10_000 });
  await expect(host.locator('[aria-label="Ola"] img[src*="hat-"][src*="antlers"]')).toBeVisible({ timeout: 10_000 });

  const screenHref = await host.getByRole("link", { name: "Open the big screen" }).getAttribute("href");
  const screen = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await screen.goto(screenHref!);
  await expect(screen.getByText("Ola").first()).toBeVisible();

  // Trying on a new hat puts her in the big screen's spotlight.
  await guest.getByRole("button", { name: "Santa hat" }).click();
  await expect(screen.locator('[aria-label="Ola"] img[src*="santa"]').first()).toBeVisible({ timeout: 10_000 });
  await screen.waitForTimeout(700);
  await screen.screenshot({ path: `${shots}/14-screen-spotlight.png` });

  // The Elf Chief names themselves right in the waiting room.
  await host.fill("#host-name", "Anna");
  await host.getByRole("button", { name: "Save", exact: true }).click();
  await expect(host.getByTestId("room-code")).toBeVisible();
  await expect(host.locator('[aria-label="Anna"]').first()).toBeVisible();
  await host.screenshot({ path: `${shots}/11-waiting-room.png` });
  await guest.screenshot({ path: `${shots}/12-guest-dressing.png` });
  await screen.screenshot({ path: `${shots}/13-screen-lobby-live.png` });
});
