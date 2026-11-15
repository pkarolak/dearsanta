import { expect, test } from "@playwright/test";
import { linkFromInbox } from "./inbox";

const stamp = Date.now();
const elves = [`zosia-${stamp}@example.com`, `kuba-${stamp}@example.com`];

test("a teacher runs the draw without taking part in it", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  host.on("dialog", (d) => void d.accept());

  await host.goto("/pl/new/plan");
  await host.fill("#hostName", "Pani Ania");
  await host.fill("#hostEmail", `teacher-${stamp}@example.com`);
  await host.fill("#title", "Klasa 3b");
  await host.getByRole("button", { name: /Każdy w swoim czasie/ }).click();
  await host.locator("textarea").fill(elves.join(", "));
  await host.getByRole("button", { name: "Utwórz sesję" }).click();
  await host.waitForURL(/\/pl\/s\/[A-Z0-9]{6}\/host/);

  await host.getByRole("button", { name: /^Ustawienia/ }).click();
  await host.getByRole("checkbox", { name: /Biorę udział w losowaniu/ }).uncheck();
  await host.getByRole("button", { name: "Zapisz ustawienia" }).click();
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
