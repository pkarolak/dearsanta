import { render } from "@react-email/render";
import { Resend } from "resend";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ChristmasEmail, santaInline, type ChristmasEmailProps } from "./ChristmasEmail";
import { logMail } from "@/lib/db/repo";
import { brand } from "@/lib/brand";

export type OutgoingMail = {
  /** Elves who joined with just a name have no address; their mail is skipped. */
  to: string | null;
  subject: string;
  /** Shown as the sender instead of the brand, e.g. "Anna via Drogi Mikołaju!"; the address stays the app's. */
  fromName?: string;
  /** Where a reply goes; the brand's contact address when unset. */
  replyTo?: string;
  email: ChristmasEmailProps;
  attachments?: { filename: string; content: string; contentType: string }[];
};

let resend: Resend | null = null;
function client() {
  if (devInboxEnabled()) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

/** MAIL_TRANSPORT=inbox keeps mail local even with a Resend key, so tests never reach real addresses. */
export function devInboxEnabled() {
  return !process.env.RESEND_API_KEY || process.env.MAIL_TRANSPORT === "inbox";
}

/** Sends mails in one batch. Without RESEND_API_KEY (or with MAIL_TRANSPORT=inbox) they land in the local inbox at /dev/mail. */
export async function sendMails(all: OutgoingMail[]) {
  const mails = all.filter((m): m is OutgoingMail & { to: string } => !!m.to);
  if (!mails.length) return;
  const resendClient = client();
  const santaSrc = resendClient ? `cid:${santaInline.contentId}` : undefined;
  const rendered = await Promise.all(
    mails.map(async (m) => {
      const email = { ...m.email, santaSrc };
      return { ...m, html: await render(ChristmasEmail(email)), text: await render(ChristmasEmail(email), { plainText: true }) };
    }),
  );

  if (!resendClient) {
    for (const m of rendered) {
      await logMail(m.to, m.subject, m.html);
      console.log(`[mail] to=${m.to} subject="${m.subject}" (open /dev/mail to read it)`);
    }
    return;
  }

  const from = process.env.MAIL_FROM ?? `${brand.name} <onboarding@resend.dev>`;
  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  const sender = (name?: string) => (name ? `"${name.replace(/["<>\\\r\n]/g, "")}" <${address}>` : from);
  const santa = { filename: santaInline.filename, content: await readFile(path.join(process.cwd(), santaInline.path)), contentId: santaInline.contentId };

  // Inline pictures are attachments, which the batch endpoint does not take, so mails go one by one,
  // paced under Resend's free-plan limit of two requests a second.
  for (const [i, m] of rendered.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 600));
    const { error } = await resendClient.emails.send({
      from: sender(m.fromName),
      replyTo: m.replyTo ?? brand.contact,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      attachments: [
        santa,
        ...(m.attachments ?? []).map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
          contentType: a.contentType,
        })),
      ],
    });
    if (error) console.error("[mail] send failed", m.to, error);
  }
}
