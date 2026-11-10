import { expect, test } from "@playwright/test";
import { linkFromInbox } from "./inbox";

const shots = "e2e/screens";
const stamp = Date.now();
const hostEmail = `chief-${stamp}@example.com`;
const guestEmail = `ola-${stamp}@example.com`;
const invitedEmail = `tom-${stamp}@example.com`;

test("live ceremony: create, join, let in, exclusions, draw and reveal", async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const invited = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

  await host.goto("/en");
  await host.screenshot({ path: `${shots}/01-landing.png` });

  // The Elf Chief creates a live session and invites Tom by e-mail.
  await host.goto("/en/new/plan");
  await host.fill("#hostName", "Anna");
  await host.fill("#hostEmail", hostEmail);
  await host.fill("#title", "Family Christmas");
  await host.fill("#budget", "100");
  await host.locator("textarea").fill(invitedEmail);
  await host.getByRole("button", { name: "Create the session" }).click();
  await host.waitForURL(/\/s\/[A-Z0-9]{6}\/host/);
  const code = host.url().match(/\/s\/([A-Z0-9]{6})\//)![1];

  // Ola scans the QR code and knocks.
  await guest.goto(`/en/join/${code}`);
  await guest.fill("#name", "Ola");
  await guest.fill("#email", guestEmail);
  await guest.getByRole("button", { name: "Knock on the workshop door" }).click();
  await expect(guest.getByRole("heading", { name: "Almost there, Ola!" })).toBeVisible();

  // Tom follows the link from his invitation e-mail and is let straight in.
  const inviteLink = await linkFromInbox(invited, invitedEmail);
  await invited.goto(inviteLink);
  await expect(invited.getByRole("heading", { name: /Hello, tom/i })).toBeVisible();
  await invited.getByRole("button", { name: "I’m not in the room" }).click();
  await expect(invited.getByRole("button", { name: /Light the fireplace/ })).toBeVisible();

  // The chief lets Ola in.
  await host.reload();
  await host.getByRole("button", { name: "Let in" }).click();
  await expect(host.getByText("Elves (3)")).toBeVisible();

  // A two-way rule between Anna and Ola leaves no valid draw for three people.
  const rules = host.locator("section", { hasText: "Who shouldn’t draw whom" });
  await rules.getByRole("button", { name: "Anna" }).click();
  await expect(rules.getByText("Anna and… who else?")).toBeVisible();
  await rules.getByRole("button", { name: "Ola" }).click();
  await expect(rules.getByText("Anna and Ola won’t draw each other")).toBeVisible();
  await expect(host.getByText(/the draw is impossible/)).toBeVisible();
  await rules.getByRole("button", { name: "One way" }).click();
  await expect(rules.getByText("Anna won’t draw Ola")).toBeVisible();
  await expect(host.getByText(/the draw is impossible/)).toBeHidden();
  await host.screenshot({ path: `${shots}/02-host-panel.png`, fullPage: true });

  // The big screen.
  const screenHref = await host.getByRole("link", { name: "Open the big screen" }).getAttribute("href");
  const screen = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await screen.goto(screenHref!);
  await expect(screen.getByText("Scan to join Santa’s workshop")).toBeVisible();
  await screen.getByRole("button", { name: /Light the fireplace/ }).click();
  await screen.screenshot({ path: `${shots}/03-screen-lobby.png` });

  // Run the ceremony chapter by chapter.
  await host.getByRole("button", { name: "Start the ceremony" }).click();
  for (const chapter of ["The elves", "The rules", "The draw", "The reveal"]) {
    await host.getByRole("button", { name: `Next: ${chapter}` }).click();
    await expect(host.getByRole("button", { name: /Next:|Replay/ }).first()).toBeEnabled();
  }
  await expect(screen.getByText("Look at your own device", { exact: true })).toBeVisible();
  await screen.screenshot({ path: `${shots}/04-screen-reveal.png` });

  // Ola unwraps her match on her phone.
  await expect(guest.getByText("Hold to unwrap")).toBeVisible({ timeout: 15_000 });
  await guest.screenshot({ path: `${shots}/05-guest-wrapped.png` });
  const gift = guest.getByRole("button", { name: "Hold to unwrap" });
  const box = (await gift.boundingBox())!;
  await guest.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await guest.mouse.down();
  await guest.waitForTimeout(1800);
  await guest.mouse.up();
  await expect(guest.getByText("This year you are surprising")).toBeVisible();
  // With Anna -> Ola excluded, the only valid three-person draw is Anna -> Tom -> Ola -> Anna.
  await expect(guest.getByTestId("receiver-name")).toHaveText("Anna");
  await guest.waitForTimeout(800);
  await guest.screenshot({ path: `${shots}/06-guest-revealed.png` });

  await invited.waitForTimeout(1500);
  await invited.screenshot({ path: `${shots}/07-remote-split.png` });

  // Everyone got a keepsake e-mail.
  await host.goto("/dev/mail");
  await expect(host.getByText("Your Secret Santa match – Family Christmas").first()).toBeVisible();
});
