import { expect, type Page } from "@playwright/test";

/** Opens the newest dev-inbox mail for `recipient` (optionally matching `subject`) and returns its magic link. */
export async function linkFromInbox(page: Page, recipient: string, subject?: string | RegExp) {
  await page.goto("/dev/mail");
  let entry = page.locator("a", { hasText: recipient });
  if (subject) entry = entry.filter({ hasText: subject });
  await entry.first().click();
  await page.waitForURL(/\/dev\/mail\?id=/);
  const html = await page.locator("iframe").getAttribute("srcdoc");
  const match = html?.match(/href="(http[^"]*\/api\/auth\/link\?[^"]+)"/);
  expect(match, `magic link for ${recipient}`).toBeTruthy();
  return match![1].replace(/&amp;/g, "&");
}
