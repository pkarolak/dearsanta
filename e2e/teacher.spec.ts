import { expect, test } from "@playwright/test";
import { linkFromInbox } from "./inbox";

const stamp = Date.now();
const elves = [`zosia-${stamp}@example.com`, `kuba-${stamp}@example.com`];

test("a teacher runs the draw without taking part in it", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  host.on("dialog", (d) => void d.accept());

  // The fully remote draw is set up step by step.
  await host.goto("/pl/new/remote");
  await host.getByRole("button", { name: "Klasa lub szkoła" }).click();
  await expect(host.locator("#rw-title")).toHaveValue("Mikołajki w klasie");
  await host.fill("#rw-title", "Klasa 3b");
  await host.getByRole("button", { name: "Dalej" }).click();
  await host.fill("#rw-budget", "30");
  // A class draw assumes the teacher only runs it.
  await expect(host.getByRole("checkbox", { name: /Biorę udział w losowaniu/ })).not.toBeChecked();
  await host.getByRole("button", { name: "Dalej" }).click();
  await host.fill("#rw-invites", elves.join(", "));
  await expect(host.getByText("Wyślemy 2 zaproszenia")).toBeVisible();
  await host.getByRole("button", { name: "Dalej" }).click();
  await host.fill("#rw-email", `teacher-${stamp}@example.com`);
  await host.getByRole("button", { name: "Otwórz warsztat" }).click();
  await host.waitForURL(/\/pl\/s\/[A-Z0-9]{6}\/host/);
  await expect(host.getByText("Prowadzisz, ale nie losujesz")).toBeVisible();
  await host.getByRole("button", { name: /^Elfy/ }).click();
  await expect(host.getByText("Prowadzi zabawę, nie losuje")).toBeVisible();

  const pages = [];
  for (const [i, email] of elves.entries()) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await page.goto(await linkFromInbox(page, email));
    await page.getByRole("radio", { name: i ? "Mężczyzna" : "Kobieta" }).click();
    await page.getByRole("button", { name: "Stwórz elfa" }).click();
    await expect(page.getByRole("button", { name: "Zmień wygląd" })).toBeVisible();
    pages.push(page);
  }

  // Only the two pupils are drawn, so they get each other and the teacher gets no one.
  await host.reload();
  await host.getByRole("button", { name: "Odblokuj losowanie" }).click();
  await expect(host.getByText(/Po losowaniu\. 0 z 2/)).toBeVisible();

  const zosia = pages[0];
  await zosia.goto(await linkFromInbox(zosia, elves[0], /Już czas/));
  await zosia.waitForURL(/\/reveal/);
  await zosia.getByRole("button", { name: /Rozpal kominek/ }).click();
  await zosia.getByRole("button", { name: "Przejdź do wyniku" }).click();
  await expect(zosia.getByTestId("receiver-name")).toHaveText(/^kuba-\d+$/);
});
