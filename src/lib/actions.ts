"use server";

import { z } from "zod";
import { avatarSchema } from "@/lib/avatar";
import { getViewer, participantLink, signInParticipant, signOutProfile } from "@/lib/auth";
import { nextStep, type CeremonyStep } from "@/lib/ceremony/steps";
import {
  addExclusion,
  addParticipant,
  bumpVersion,
  createSession,
  deleteExclusion,
  deleteParticipant,
  findParticipantByEmail,
  getAssignmentForGiver,
  getParticipant,
  getSessionByCode,
  listParticipants,
  markRevealed,
  runDraw,
  saveProfileFromParticipant,
  setCeremonyStep,
  updateParticipant,
  updateSession,
  type Session,
} from "@/lib/db/repo";
import { DrawError } from "@/lib/draw";
import { toLocale, translatorFor } from "@/lib/i18n-server";
import {
  sendDrawReady,
  sendHostWelcome,
  sendInvites,
  sendLoginLink,
  sendProfileThanks,
  sendResults,
} from "@/lib/mail/messages";
import { sendMails } from "@/lib/mail/send";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; detail?: string[] };

const email = z.string().trim().toLowerCase().email().max(200);
const name = z.string().trim().min(1).max(40);
const currency = z.enum(["PLN", "EUR", "USD", "GBP", "BRL", "CHF"]);

async function loadSession(code: string) {
  const session = await getSessionByCode(code);
  if (!session) throw new ActionError("not_found");
  return session;
}

class ActionError extends Error {
  constructor(
    public readonly code: string,
    public readonly detail?: string[],
  ) {
    super(code);
  }
}

async function requireHost(code: string) {
  const session = await loadSession(code);
  const viewer = await getViewer(session);
  if (!viewer.isHost || !viewer.participant) throw new ActionError("forbidden");
  return { session, host: viewer.participant };
}

async function requireParticipant(code: string) {
  const session = await loadSession(code);
  const viewer = await getViewer(session);
  if (!viewer.participant) throw new ActionError("forbidden");
  return { session, me: viewer.participant, isHost: viewer.isHost };
}

async function run<T extends object>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.code, detail: error.detail };
    if (error instanceof z.ZodError) return { ok: false, error: "invalid", detail: error.issues.map((i) => i.path.join(".")) };
    console.error("[action]", error);
    return { ok: false, error: "unknown" };
  }
}

/* ---------- creating & joining ---------- */

const createSchema = z.object({
  title: z.string().trim().min(1).max(80),
  mode: z.enum(["sync", "async"]),
  locale: z.string(),
  timezone: z.string().max(64),
  scheduledAt: z.string().datetime().nullable(),
  location: z.string().trim().max(200).nullable(),
  onlineUrl: z.string().trim().url().max(300).nullable(),
  budgetAmount: z.number().positive().max(100000).nullable(),
  currency,
  hostName: name,
  hostEmail: email,
  invites: z.array(email).max(100),
});

export async function createSessionAction(input: z.input<typeof createSchema>) {
  return run(async () => {
    const data = createSchema.parse(input);
    const locale = toLocale(data.locale);
    const { session, host } = await createSession({
      title: data.title,
      mode: data.mode,
      locale,
      timezone: data.timezone || "UTC",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      location: data.location || null,
      onlineUrl: data.onlineUrl || null,
      budgetAmount: data.budgetAmount,
      currency: data.currency,
      host: { name: data.hostName, email: data.hostEmail, locale },
    });
    await signInParticipant(session, host.id);
    await sendHostWelcome(session, host);
    const invitees = [];
    for (const address of new Set(data.invites.filter((e) => e !== host.email))) {
      invitees.push(await addParticipant(session.id, { email: address, status: "invited", emailVerified: false }));
    }
    if (invitees.length) await sendInvites(session, host, invitees);
    return { code: session.code };
  });
}

const quickModes = { together: "sync", remote: "sync", ownTime: "async" } as const;
const localCurrency: Record<string, z.infer<typeof currency>> = { pl: "PLN", en: "GBP", de: "EUR", es: "EUR", pt: "EUR" };

/**
 * One tap from the landing page: a session with sensible defaults and an open door,
 * so the Elf Chief lands straight in the waiting room. Everything else can be set there later.
 */
export async function quickStartAction(input: { kind: keyof typeof quickModes; locale: string; timezone: string }) {
  return run(async () => {
    const kind = z.enum(["together", "remote", "ownTime"]).parse(input.kind);
    const locale = toLocale(input.locale);
    const t = translatorFor(locale, "create");
    const { session, host } = await createSession({
      title: t("quick.title"),
      mode: quickModes[kind],
      locale,
      timezone: z.string().max(64).catch("UTC").parse(input.timezone) || "UTC",
      scheduledAt: null,
      location: null,
      onlineUrl: null,
      budgetAmount: null,
      currency: localCurrency[locale] ?? "EUR",
      autoAdmit: true,
      host: { name: t("quick.hostName"), email: null, locale },
    });
    await signInParticipant(session, host.id);
    return { code: session.code };
  });
}

export async function joinSessionAction(input: { code: string; name: string; email?: string; locale: string }) {
  return run(async () => {
    const session = await loadSession(input.code);
    const data = z.object({ name, email: email.optional().or(z.literal("").transform(() => undefined)) }).parse(input);
    if (session.status === "done") throw new ActionError("closed");
    const status = session.autoAdmit ? "approved" : "pending";
    if (!data.email) {
      if (!session.autoAdmit) throw new ActionError("invalid", ["email"]);
      const participant = await addParticipant(session.id, { email: null, displayName: data.name, status, emailVerified: false });
      await signInParticipant(session, participant.id);
      return { next: "waiting" as const };
    }
    const existing = await findParticipantByEmail(session.id, data.email);

    if (existing && existing.status === "approved") {
      // Already in: continuing on another device needs proof of the e-mail address.
      const t = translatorFor(session.locale, "email");
      const link = await participantLink(existing, toLocale(input.locale));
      await sendMails([
        {
          to: existing.email,
          subject: t("continue.subject", { title: session.title }),
          email: {
            lang: session.locale,
            preview: t("continue.subject", { title: session.title }),
            heading: t("continue.heading", { name: existing.displayName }),
            paragraphs: [t("continue.body")],
            cta: { label: t("continue.cta"), href: link },
            footer: t("footer"),
          },
        },
      ]);
      return { next: "check_email" as const };
    }

    const participant =
      existing && existing.status !== "rejected"
        ? existing
        : await addParticipant(session.id, { email: data.email, displayName: data.name, status, emailVerified: false });
    if (!participant.profileCompletedAt && participant.displayName !== data.name) {
      await updateParticipant(participant, { displayName: data.name });
    }
    await signInParticipant(session, participant.id);
    return { next: "waiting" as const };
  });
}

export async function requestLoginLinkAction(input: { email: string; locale: string }) {
  return run(async () => {
    const address = email.parse(input.email);
    await sendLoginLink(address, toLocale(input.locale));
    return {};
  });
}

export async function signOutAction() {
  await signOutProfile();
  return { ok: true as const };
}

/* ---------- Elf Chief: people ---------- */

export async function approveParticipantAction(code: string, participantId: string, approve: boolean) {
  return run(async () => {
    const { session } = await requireHost(code);
    const p = await getParticipant(participantId);
    if (!p || p.sessionId !== session.id || p.role === "host") throw new ActionError("not_found");
    if (session.drawnAt) throw new ActionError("already_drawn");
    await updateParticipant(p, { status: approve ? "approved" : "rejected" });
    return {};
  });
}

export async function removeParticipantAction(code: string, participantId: string) {
  return run(async () => {
    const { session } = await requireHost(code);
    if (session.drawnAt) throw new ActionError("already_drawn");
    const p = await getParticipant(participantId);
    if (!p || p.sessionId !== session.id) throw new ActionError("not_found");
    await deleteParticipant(p);
    return {};
  });
}

export async function inviteAction(code: string, emails: string[]) {
  return run(async () => {
    const { session, host } = await requireHost(code);
    if (session.drawnAt) throw new ActionError("already_drawn");
    const addresses = z.array(email).min(1).max(100).parse(emails);
    const invitees = [];
    for (const address of new Set(addresses)) {
      const existing = await findParticipantByEmail(session.id, address);
      if (existing && existing.status !== "rejected") {
        if (existing.status === "invited") invitees.push(existing);
        continue;
      }
      invitees.push(await addParticipant(session.id, { email: address, status: "invited", emailVerified: false }));
    }
    await sendInvites(session, host, invitees);
    return { sent: invitees.length };
  });
}

export async function resendInviteAction(code: string, participantId: string) {
  return run(async () => {
    const { session, host } = await requireHost(code);
    const p = await getParticipant(participantId);
    if (!p || p.sessionId !== session.id) throw new ActionError("not_found");
    await sendInvites(session, host, [p]);
    return {};
  });
}

export async function setRemoteAction(code: string, participantId: string, isRemote: boolean) {
  return run(async () => {
    const { session, me, isHost } = await requireParticipant(code);
    if (!isHost && participantId !== me.id) throw new ActionError("forbidden");
    const p = await getParticipant(participantId);
    if (!p || p.sessionId !== session.id) throw new ActionError("not_found");
    await updateParticipant(p, { isRemote });
    return {};
  });
}

/* ---------- Elf Chief: settings & exclusions ---------- */

const settingsSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  onlineUrl: z.union([z.string().trim().url().max(300), z.literal("")]).nullable().optional(),
  budgetAmount: z.number().positive().max(100000).nullable().optional(),
  currency: currency.optional(),
  locale: z.string().optional(),
  mode: z.enum(["sync", "async"]).optional(),
});

export async function updateSettingsAction(code: string, input: z.input<typeof settingsSchema>) {
  return run(async () => {
    const { session } = await requireHost(code);
    const data = settingsSchema.parse(input);
    if (session.drawnAt && (data.mode || data.budgetAmount !== undefined)) throw new ActionError("already_drawn");
    if (data.mode && session.ceremonyStep !== "lobby") throw new ActionError("ceremony_started");
    await updateSession(session.id, {
      title: data.title,
      scheduledAt: data.scheduledAt === undefined ? undefined : data.scheduledAt ? new Date(data.scheduledAt) : null,
      location: data.location === undefined ? undefined : data.location || null,
      onlineUrl: data.onlineUrl === undefined ? undefined : data.onlineUrl || null,
      budgetAmount: data.budgetAmount,
      currency: data.currency,
      locale: data.locale ? toLocale(data.locale) : undefined,
      mode: data.mode,
    });
    return {};
  });
}

export async function addExclusionAction(code: string, giverId: string, receiverId: string, bidirectional: boolean) {
  return run(async () => {
    const { session } = await requireHost(code);
    if (session.drawnAt) throw new ActionError("already_drawn");
    if (giverId === receiverId) throw new ActionError("invalid");
    await addExclusion(session.id, giverId, receiverId, bidirectional);
    return {};
  });
}

export async function deleteExclusionAction(code: string, exclusionId: string) {
  return run(async () => {
    const { session } = await requireHost(code);
    if (session.drawnAt) throw new ActionError("already_drawn");
    await deleteExclusion(session.id, exclusionId);
    return {};
  });
}

/* ---------- the draw ---------- */

async function draw(session: Session) {
  try {
    await runDraw(session.id);
  } catch (error) {
    if (error instanceof DrawError) {
      const participants = await listParticipants(session.id);
      const names = new Map(participants.map((p) => [p.id, p.displayName]));
      throw new ActionError(
        error.feasibility.reason === "too_few" ? "too_few" : "infeasible",
        error.feasibility.blockedGiverIds.map((id) => names.get(id) ?? "?"),
      );
    }
    throw error;
  }
}

async function pairsFor(session: Session) {
  const participants = (await listParticipants(session.id)).filter((p) => p.status === "approved");
  const pairs = [];
  for (const giver of participants) {
    const a = await getAssignmentForGiver(session.id, giver.id);
    if (a) pairs.push({ giver, receiver: a.receiver });
  }
  return pairs;
}

/** Sync mode: the Elf Chief moves the ceremony forward; Santa draws when the "draw" chapter begins. */
export async function advanceCeremonyAction(code: string, target?: CeremonyStep) {
  return run(async () => {
    const { session } = await requireHost(code);
    if (session.mode !== "sync") throw new ActionError("wrong_mode");
    const step = target === session.ceremonyStep ? target : nextStep(session.ceremonyStep);
    if (!step) throw new ActionError("finished");

    if (step === "draw" && !session.drawnAt) {
      const pending = (await listParticipants(session.id)).filter((p) => p.status === "pending");
      if (pending.length) throw new ActionError("pending_guests", pending.map((p) => p.displayName));
      await draw(session);
    }

    const enteringReveal = step === "reveal" && session.status !== "drawn" && session.status !== "done";
    const status =
      step === "farewell" ? "done" : step === "reveal" ? "drawn" : session.status === "open" ? "ceremony" : undefined;
    await setCeremonyStep(session.id, step, status);
    if (enteringReveal) await sendResults(session, await pairsFor(session));
    return { step };
  });
}

/** Async mode: unlocking immediately runs the one and only draw and e-mails everybody. */
export async function unlockDrawAction(code: string) {
  return run(async () => {
    const { session } = await requireHost(code);
    if (session.mode !== "async") throw new ActionError("wrong_mode");
    if (session.drawnAt) throw new ActionError("already_drawn");
    const pending = (await listParticipants(session.id)).filter((p) => p.status === "pending");
    if (pending.length) throw new ActionError("pending_guests", pending.map((p) => p.displayName));
    await draw(session);
    await setCeremonyStep(session.id, "reveal", "drawn");
    const participants = (await listParticipants(session.id)).filter((p) => p.status === "approved");
    await sendDrawReady(session, participants);
    return {};
  });
}

/* ---------- elves ---------- */

const profileSchema = z.object({ displayName: name, avatar: avatarSchema });

export async function saveProfileAction(code: string, input: z.input<typeof profileSchema>, locale: string) {
  return run(async () => {
    const { session, me } = await requireParticipant(code);
    if (me.status !== "approved") throw new ActionError("not_approved");
    const data = profileSchema.parse(input);
    const firstTime = !me.profileCompletedAt;
    await updateParticipant(me, {
      displayName: data.displayName,
      avatar: data.avatar,
      profileCompletedAt: me.profileCompletedAt ?? new Date(),
    });
    const updated = { ...me, displayName: data.displayName, avatar: data.avatar };
    if (me.emailVerified) await saveProfileFromParticipant(updated, toLocale(locale));
    const upcoming = session.mode === "async" || (session.scheduledAt && session.scheduledAt.getTime() > Date.now() + 3600_000);
    if (firstTime && upcoming && !session.drawnAt) await sendProfileThanks(session, updated);
    return {};
  });
}

/** Every tweak in the elf editor shows up on the big screen at once, before the elf is happy with it. */
export async function previewProfileAction(code: string, input: { displayName?: string; avatar?: unknown }) {
  return run(async () => {
    const { me } = await requireParticipant(code);
    if (me.status !== "approved") throw new ActionError("not_approved");
    const data = z.object({ displayName: name.optional().catch(undefined), avatar: avatarSchema.optional() }).parse(input);
    await updateParticipant(me, data);
    return {};
  });
}

/** The Elf Chief can leave an address later, to get the keepsake mail and come back from another device. */
export async function setMyEmailAction(code: string, address: string) {
  return run(async () => {
    const { me } = await requireParticipant(code);
    await updateParticipant(me, { email: email.parse(address) });
    return {};
  });
}

export async function markRevealedAction(code: string) {
  return run(async () => {
    const { session, me } = await requireParticipant(code);
    await markRevealed(session.id, me.id);
    await bumpVersion(session.id);
    return {};
  });
}
