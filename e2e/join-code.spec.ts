import { expect, test } from "@playwright/test";

const shots = "e2e/screens";

test("a guest lands on the home page and joins with the code from the organiser", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await host.goto("/en/new");
  await host.getByRole("button", { name: /A Secret Santa party/ }).click();
  await host.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = host.url().match(/\/s\/([A-Z0-9]{6})\//)![1];

  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
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
});
