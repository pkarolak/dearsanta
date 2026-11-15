import { expect, test } from "@playwright/test";

const shots = "e2e/screens";

test("party on a laptop: pair the phone, the laptop becomes the stage, guests join and dress up live", async ({ browser }) => {
  const laptop = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();

  await laptop.goto("/en/new");
  await laptop.waitForTimeout(900);
  await laptop.screenshot({ path: `${shots}/10-mode-picker.png` });
  await expect(laptop.getByText("Big screen or your own devices")).toBeVisible();
  await laptop.getByRole("button", { name: /A live draw, together/ }).click();
  await laptop.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = laptop.url().match(/\/s\/([A-Z0-9]{6})\//)![1];

  // The party needs two devices: the laptop says so first and pairs the Elf Chief's phone.
  await expect(laptop.getByRole("heading", { name: "Get two devices ready" })).toBeVisible();
  await laptop.getByRole("radio", { name: "Computer or TV" }).click();
  const qr = laptop.getByTestId("phone-qr");
  await expect(qr).toHaveAttribute("data-url", /\/api\/auth\/link\?/);
  await laptop.waitForTimeout(500);
  await laptop.screenshot({ path: `${shots}/16-pair-phone.png` });
  await phone.goto((await qr.getAttribute("data-url"))!);
  await phone.waitForURL(new RegExp(`/s/${code}/host$`));

  // Once the phone is in, the laptop turns into the stage by itself.
  await expect(laptop.getByText("Phone connected!")).toBeVisible({ timeout: 10_000 });
  await laptop.waitForURL(new RegExp(`/s/${code}/screen\\?k=`), { timeout: 10_000 });

  // The phone is the remote: no second QR code, the guests scan the one on the big screen.
  await expect(phone.getByTestId("room-code")).toHaveText(code, { timeout: 10_000 });
  await expect(phone.getByText("Guests scan the code on the big screen.", { exact: false })).toBeVisible();

  // Ola scans the code and only types her name; the door opens by itself.
  await guest.goto(`/en/join/${code}`);
  await guest.fill("#name", "Ola");
  await guest.getByRole("button", { name: "Knock on the workshop door" }).click();
  await guest.waitForURL(new RegExp(`/s/${code}/me`));
  await expect(guest.getByRole("heading", { name: "Who are you?" })).toBeVisible();
  await guest.getByRole("radio", { name: "Woman" }).click();
  await guest.getByRole("tab", { name: "Hat" }).click();

  // Every tweak shows up for the room before she saves anything.
  await guest.getByRole("button", { name: "Antlers" }).click();
  await expect(phone.getByText("2 elves inside")).toBeVisible({ timeout: 10_000 });
  await expect(phone.locator('[aria-label="Ola"] img[src*="-antlers.webp"]')).toBeVisible({ timeout: 10_000 });
  await expect(laptop.getByText("Ola").first()).toBeVisible();

  // Trying on a new hat puts her in the big screen's spotlight.
  await guest.getByRole("button", { name: "Santa hat" }).click();
  await expect(laptop.locator('[aria-label="Ola"] img[src*="-santa.webp"]').first()).toBeVisible({ timeout: 10_000 });
  await laptop.waitForTimeout(700);
  await laptop.screenshot({ path: `${shots}/14-screen-spotlight.png` });

  // The Elf Chief names themselves on the phone and dresses up there too.
  await phone.fill("#host-name", "Anna");
  await phone.getByRole("button", { name: "Save", exact: true }).click();
  await expect(phone.locator('[aria-label="Anna"]').first()).toBeVisible();
  await phone.screenshot({ path: `${shots}/11-remote.png`, fullPage: true });
  await guest.screenshot({ path: `${shots}/12-guest-dressing.png` });
  await laptop.screenshot({ path: `${shots}/13-screen-lobby-live.png` });
  await phone.getByRole("link", { name: "Make your elf" }).click();
  await phone.waitForURL(new RegExp(`/s/${code}/me`));
  await phone.getByRole("button", { name: "Change look" }).click();
  await phone.getByRole("tab", { name: "Hat" }).click();
  // Any hat that fits her random elf and isn't on yet.
  const hats = { "Santa hat": "santa", "Elf hat": "elf", Beanie: "beanie", Antlers: "antlers" };
  const hat = phone.getByRole("button", { name: /^(Santa hat|Elf hat|Beanie|Antlers)$/, pressed: false, disabled: false }).first();
  const slug = hats[(await hat.innerText()).trim() as keyof typeof hats];
  await hat.click();
  await expect(laptop.locator(`[aria-label="Anna"] img[src*="-${slug}.webp"]`).first()).toBeVisible({ timeout: 10_000 });
});

test("party on a phone: the TV opens the stage with the short code, then the phone is the remote", async ({ browser }) => {
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const tv = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();

  await phone.goto("/en/new");
  await phone.getByRole("button", { name: /A live draw, together/ }).click();
  await phone.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = phone.url().match(/\/s\/([A-Z0-9]{6})\//)![1];
  await phone.getByRole("radio", { name: "Phone" }).click();
  await phone.waitForTimeout(400);
  const screenCode = (await phone.getByTestId("screen-code").innerText()).replace(/\D/g, "");
  await phone.screenshot({ path: `${shots}/15-pair-tv.png`, fullPage: true });

  // The TV cannot scan, so it opens the big screen by typing the short screen code.
  await tv.goto("/tv");
  await tv.fill("#tv-code", "000000");
  await tv.getByRole("button", { name: "Open the screen" }).click();
  await expect(tv.getByText("We don’t know that code.")).toBeVisible();
  await tv.fill("#tv-code", screenCode);
  await tv.getByRole("button", { name: "Open the screen" }).click();
  await tv.waitForURL(new RegExp(`/s/${code}/screen\\?k=`));

  await expect(phone.getByText("Big screen connected!")).toBeVisible({ timeout: 10_000 });
  await phone.getByRole("button", { name: "Go to the remote" }).click();
  await expect(phone.getByTestId("room-code")).toHaveText(code);
  await expect(phone.getByRole("button", { name: "Start the ceremony" })).toBeVisible();
});
