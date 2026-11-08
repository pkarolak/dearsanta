import { render } from "@react-email/render";
import { Resend } from "resend";
import { ChristmasEmail, type ChristmasEmailProps } from "./ChristmasEmail";
import { logMail } from "@/lib/db/repo";

export type OutgoingMail = {
  to: string;
  subject: string;
  email: ChristmasEmailProps;
  attachments?: { filename: string; content: string; contentType: string }[];
};

let resend: Resend | null = null;
function client() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export function devInboxEnabled() {
  return !process.env.RESEND_API_KEY;
}

/** Sends mails in one batch. Without RESEND_API_KEY they land in the local inbox at /dev/mail. */
export async function sendMails(mails: OutgoingMail[]) {
  if (!mails.length) return;
  const rendered = await Promise.all(
    mails.map(async (m) => ({ ...m, html: await render(ChristmasEmail(m.email)), text: await render(ChristmasEmail(m.email), { plainText: true }) })),
  );

  const resendClient = client();
  if (!resendClient) {
    for (const m of rendered) {
      await logMail(m.to, m.subject, m.html);
      console.log(`[mail] to=${m.to} subject="${m.subject}" (open /dev/mail to read it)`);
    }
    return;
  }

  const from = process.env.MAIL_FROM ?? "Santa Helper <onboarding@resend.dev>";
  const withAttachments = rendered.filter((m) => m.attachments?.length);
  const plain = rendered.filter((m) => !m.attachments?.length);

  // The batch endpoint does not accept attachments, so those go one by one.
  for (let i = 0; i < plain.length; i += 100) {
    const { error } = await resendClient.batch.send(
      plain.slice(i, i + 100).map((m) => ({ from, to: m.to, subject: m.subject, html: m.html, text: m.text })),
    );
    if (error) console.error("[mail] batch failed", error);
  }
  for (const m of withAttachments) {
    const { error } = await resendClient.emails.send({
      from,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      attachments: m.attachments!.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString("base64"),
        contentType: a.contentType,
      })),
    });
    if (error) console.error("[mail] send failed", m.to, error);
  }
}
