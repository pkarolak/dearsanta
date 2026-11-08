import { appUrl, createLoginToken, participantLink } from "@/lib/auth";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";
import type { Participant, Session } from "@/lib/db/repo";
import { formatMoney, formatWhen, toLocale, translatorFor } from "@/lib/i18n-server";
import { sendMails, type OutgoingMail } from "./send";

function sessionDetails(session: Session, host: Participant | undefined) {
  const t = translatorFor(session.locale, "email");
  const details: { label: string; value: string }[] = [];
  if (host) details.push({ label: t("details.host"), value: host.displayName });
  if (session.scheduledAt)
    details.push({ label: t("details.when"), value: formatWhen(session.scheduledAt, session.locale, session.timezone) });
  if (session.location) details.push({ label: t("details.where"), value: session.location });
  if (session.onlineUrl) details.push({ label: t("details.online"), value: session.onlineUrl });
  if (session.budgetAmount)
    details.push({ label: t("details.budget"), value: formatMoney(session.budgetAmount, session.currency, session.locale) });
  details.push({ label: t("details.code"), value: session.code });
  return details;
}

export function calendarEvent(session: Session, host: Participant | undefined) {
  if (!session.scheduledAt) return null;
  const t = translatorFor(session.locale, "email");
  return {
    uid: session.id,
    title: t("calendarTitle", { title: session.title }),
    description: t("calendarDescription", { host: host?.displayName ?? "Santa", code: session.code }),
    start: session.scheduledAt,
    location: session.location ?? session.onlineUrl,
    url: `${appUrl()}/${toLocale(session.locale)}/join/${session.code}`,
  };
}

export async function sendInvites(session: Session, host: Participant | undefined, invitees: Participant[]) {
  const t = translatorFor(session.locale, "email");
  const event = calendarEvent(session, host);
  const ics = event ? buildIcs(event) : null;
  const mails: OutgoingMail[] = [];
  for (const p of invitees) {
    const link = await participantLink(p, session.locale);
    const links = event
      ? [
          { label: t("invite.google"), href: googleCalendarUrl(event) },
          { label: t("invite.ics"), href: `${appUrl()}/api/s/${session.code}/ics` },
        ]
      : [];
    mails.push({
      to: p.email,
      subject: t("invite.subject", { host: host?.displayName ?? "Santa", title: session.title }),
      attachments: ics ? [{ filename: "secret-santa.ics", content: ics, contentType: "text/calendar" }] : undefined,
      email: {
        lang: session.locale,
        preview: t("invite.preview", { title: session.title }),
        heading: t("invite.heading", { name: p.displayName }),
        paragraphs: [
          t("invite.body", { host: host?.displayName ?? "Santa", title: session.title }),
          session.mode === "async" ? t("invite.bodyAsync") : t("invite.bodySync"),
        ],
        details: sessionDetails(session, host),
        cta: { label: t("invite.cta"), href: link },
        links,
        footer: t("footer"),
      },
    });
  }
  await sendMails(mails);
}

export async function sendHostWelcome(session: Session, host: Participant) {
  const t = translatorFor(session.locale, "email");
  const link = await participantLink(host, session.locale, `/s/${session.code}/host`);
  await sendMails([
    {
      to: host.email,
      subject: t("host.subject", { title: session.title }),
      email: {
        lang: session.locale,
        preview: t("host.subject", { title: session.title }),
        heading: t("host.heading", { name: host.displayName }),
        paragraphs: [t("host.body", { code: session.code })],
        details: sessionDetails(session, host),
        cta: { label: t("host.cta"), href: link },
        footer: t("footer"),
      },
    },
  ]);
}

export async function sendProfileThanks(session: Session, participant: Participant) {
  const t = translatorFor(session.locale, "email");
  const link = await participantLink(participant, session.locale);
  await sendMails([
    {
      to: participant.email,
      subject: t("profile.subject"),
      email: {
        lang: session.locale,
        preview: t("profile.subject"),
        heading: t("profile.heading", { name: participant.displayName }),
        paragraphs: [session.mode === "async" ? t("profile.bodyAsync") : t("profile.bodySync")],
        cta: { label: t("profile.cta"), href: link },
        footer: t("footer"),
      },
    },
  ]);
}

/** Async mode: tells everyone the draw happened, without revealing anything in the mail itself. */
export async function sendDrawReady(session: Session, participants: Participant[]) {
  const t = translatorFor(session.locale, "email");
  const mails: OutgoingMail[] = [];
  for (const p of participants) {
    const link = await participantLink(p, session.locale, `/s/${session.code}/reveal`);
    mails.push({
      to: p.email,
      subject: t("drawReady.subject"),
      email: {
        lang: session.locale,
        preview: t("drawReady.subject"),
        heading: t("drawReady.heading", { name: p.displayName }),
        paragraphs: [t("drawReady.body")],
        cta: { label: t("drawReady.cta"), href: link },
        footer: t("footer"),
      },
    });
  }
  await sendMails(mails);
}

/** Sync mode: a private keepsake of the match, sent when Santa reveals the results on devices. */
export async function sendResults(session: Session, pairs: { giver: Participant; receiver: Participant }[]) {
  const t = translatorFor(session.locale, "email");
  const mails: OutgoingMail[] = [];
  for (const { giver, receiver } of pairs) {
    const link = await participantLink(giver, session.locale);
    mails.push({
      to: giver.email,
      subject: t("result.subject", { title: session.title }),
      email: {
        lang: session.locale,
        preview: t("result.preview"),
        heading: t("result.heading", { name: giver.displayName }),
        paragraphs: [t("result.body")],
        highlight: {
          label: t("result.label"),
          value: receiver.displayName,
          note: session.budgetAmount
            ? t("result.budgetNote", { budget: formatMoney(session.budgetAmount, session.currency, session.locale) })
            : undefined,
        },
        cta: { label: t("result.cta"), href: link },
        footer: t("footer"),
      },
    });
  }
  await sendMails(mails);
}

export async function sendLoginLink(email: string, locale: string) {
  const t = translatorFor(locale, "email");
  const token = await createLoginToken(email);
  const href = `${appUrl()}/api/auth/link?${new URLSearchParams({ token, locale: toLocale(locale) })}`;
  await sendMails([
    {
      to: email,
      subject: t("login.subject"),
      email: {
        lang: locale,
        preview: t("login.subject"),
        heading: t("login.heading"),
        paragraphs: [t("login.body")],
        cta: { label: t("login.cta"), href },
        footer: t("footer"),
      },
    },
  ]);
}
