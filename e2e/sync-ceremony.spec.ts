import { expect, test } from "@playwright/test";
import { linkFromInbox } from "./inbox";

const shots = "e2e/screens";
const stamp = Date.now();
const hostEmail = `chief-${stamp}@example.com`;
const guestEmail = `ola-${stamp}@example.com`;
const invitedEmail = `tom-${stamp}@example.com`;

test("live ceremony: create, join, let in, exclusions, draw and reveal", async ({ browser }) => {
  // The Elf Chief waits for Santa to finish every chapter, as at a real party.
  test.setTimeout(240_000);
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
  await host.getByRole("button", { name: "I only have one device" }).click();

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
  // A first visit walks through a short wizard: who you are, the elf's look, where you watch from.
  await invited.getByRole("radio", { name: "Man", exact: true }).click();
  await invited.getByRole("button", { name: "Next", exact: true }).click();
  await invited.getByRole("radio", { name: /I’m not in the room/ }).click();
  await expect(invited.getByRole("button", { name: /Light the fireplace/ })).toBeVisible();

  // The chief lets Ola in.
  await host.reload();
  await host.getByRole("button", { name: "Let in" }).click();
  await expect(host.getByRole("button", { name: /^Elves.*3 elves/ })).toBeVisible();
  await host.getByRole("button", { name: /^Who shouldn’t draw whom/ }).click();

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

  // Santa runs the show himself; the chief only answers his two questions.
  await host.getByRole("button", { name: "Start the ceremony" }).click();
  const allHere = host.getByRole("button", { name: "Yes, let’s begin" });
  await expect(allHere).toBeEnabled({ timeout: 90_000 });
  await expect(screen.getByRole("button", { name: "Yes, let’s begin" })).toBeVisible();
  await screen.screenshot({ path: `${shots}/03b-screen-question.png` });
  await host.screenshot({ path: `${shots}/03c-host-question.png` });
  await allHere.click();
  await expect(host.getByText("Santa will carry on by himself")).toBeVisible();
  await host.screenshot({ path: `${shots}/03d-host-auto.png` });
  const letsDraw = host.getByRole("button", { name: "Let’s draw!" });
  await expect(letsDraw).toBeEnabled({ timeout: 120_000 });
  await screen.getByRole("button", { name: "Let’s draw!" }).click();
  // After the draw Santa moves on to the reveal by himself.
  await expect(screen.getByText("Look at your own device", { exact: true })).toBeVisible({ timeout: 60_000 });
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

  // Not everyone has unwrapped yet, so the chief moves on to the farewell by hand.
  await host.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 60_000 });
  // The banner waits for Santa's goodbye and the closing curtain.
  await expect(screen.getByText("Merry Christmas!", { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(screen.getByText("For the rest of the evening")).toBeInViewport({ timeout: 20_000 });
  await screen.screenshot({ path: `${shots}/08-screen-curtain.png` });

  // Everyone got a keepsake e-mail.
  await host.goto("/dev/mail");
  await expect(host.getByText("Your Secret Santa match – Family Christmas").first()).toBeVisible();
});
