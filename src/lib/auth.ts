import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { findParticipantByEmail, getParticipant, insertToken, normalizeEmail, type Participant, type Session } from "@/lib/db/repo";
import { appOrigin } from "@/lib/urls";

const PROFILE_COOKIE = "sh_profile";
const participantCookie = (code: string) => `sh_p_${code.toUpperCase()}`;
const hostCookie = (code: string) => `sh_h_${code.toUpperCase()}`;

/**
 * Opening a guest link must not forget a host who is already in this browser.
 * The host seat is a second cookie, so the guest view can be open and the host can switch back.
 */
export function hostSeatPlan(input: { nextIsHost: boolean; alreadyParked: boolean; currentIsHost: boolean; emailIsHost: boolean }) {
  if (input.nextIsHost) return "replace-with-host" as const;
  if (input.alreadyParked) return "keep" as const;
  if (input.currentIsHost) return "park-current" as const;
  if (input.emailIsHost) return "park-email" as const;
  return "guest-only" as const;
}
const NINETY_DAYS = 60 * 60 * 24 * 90;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production");
    return new TextEncoder().encode("santa-helper-local-development-secret");
  }
  return new TextEncoder().encode(value);
}

async function sign(payload: Record<string, string>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${NINETY_DAYS}s`)
    .sign(secret());
}

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as Record<string, string>;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: NINETY_DAYS,
};

async function participantFromCookie(token: string | undefined, session: Pick<Session, "id">) {
  const payload = await verify(token);
  if (payload?.sid !== session.id || !payload.pid) return null;
  const participant = await getParticipant(payload.pid);
  if (!participant || participant.sessionId !== session.id) return null;
  return participant;
}

/** Remembers the host in this browser before a guest sign-in replaces the current seat. */
async function parkHost(jar: Awaited<ReturnType<typeof cookies>>, session: Pick<Session, "code" | "id">) {
  const parked = await participantFromCookie(jar.get(hostCookie(session.code))?.value, session);
  const currentToken = jar.get(participantCookie(session.code))?.value;
  const current = await participantFromCookie(currentToken, session);
  const email = await getVerifiedEmail();
  const byEmail = email ? await findParticipantByEmail(session.id, email) : null;
  const plan = hostSeatPlan({
    nextIsHost: false,
    alreadyParked: parked?.role === "host",
    currentIsHost: current?.role === "host",
    emailIsHost: byEmail?.role === "host",
  });
  if (plan === "park-current" && currentToken) jar.set(hostCookie(session.code), currentToken, cookieOptions);
  if (plan === "park-email" && byEmail) {
    jar.set(hostCookie(session.code), await sign({ pid: byEmail.id, sid: session.id }), cookieOptions);
  }
}

export async function signInParticipant(session: Pick<Session, "code" | "id">, participantId: string) {
  const next = await getParticipant(participantId);
  if (!next || next.sessionId !== session.id) return;
  const jar = await cookies();
  const token = await sign({ pid: next.id, sid: session.id });
  if (next.role === "host") jar.set(hostCookie(session.code), token, cookieOptions);
  else await parkHost(jar, session);
  jar.set(participantCookie(session.code), token, cookieOptions);
}

/** The host kept beside a guest sign-in, if this browser still has one. */
export async function parkedHost(session: Pick<Session, "code" | "id">) {
  const participant = await participantFromCookie((await cookies()).get(hostCookie(session.code))?.value, session);
  return participant?.role === "host" ? participant : null;
}

/** Switches this browser back to the parked host and restores that host's verified email. */
export async function resumeHost(session: Pick<Session, "code" | "id">) {
  const host = await parkedHost(session);
  const token = (await cookies()).get(hostCookie(session.code))?.value;
  if (!host || !token) return false;
  const jar = await cookies();
  jar.set(participantCookie(session.code), token, cookieOptions);
  if (host.email) await signInProfile(host.email);
  return true;
}

export async function signInProfile(email: string) {
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, await sign({ email: normalizeEmail(email) }), cookieOptions);
}

export async function signOutProfile() {
  (await cookies()).delete(PROFILE_COOKIE);
}

/** E-mail verified through a magic link, valid across all sessions. */
export async function getVerifiedEmail() {
  const payload = await verify((await cookies()).get(PROFILE_COOKIE)?.value);
  return payload?.email ?? null;
}

export type Viewer = { participant: Participant | null; isHost: boolean; isScreen: boolean };

/**
 * Resolves who is looking at a session: a per-session participant cookie, a verified e-mail that
 * belongs to a participant, or the big screen opened with the session's screen key.
 */
export async function getViewer(session: Session, screenKey?: string | null): Promise<Viewer> {
  const jar = await cookies();
  let participant = await participantFromCookie(jar.get(participantCookie(session.code))?.value, session);
  if (!participant) {
    const email = await getVerifiedEmail();
    if (email) participant = await findParticipantByEmail(session.id, email);
  }
  const isScreen = !!screenKey && screenKey === session.screenKey;
  return { participant, isHost: participant?.role === "host", isScreen };
}

/* ---------- magic links ---------- */

export const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

export async function createLoginToken(email: string) {
  const raw = randomBytes(32).toString("base64url");
  await insertToken({
    hash: hashToken(raw),
    purpose: "login",
    email,
    participantId: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  });
  return raw;
}

/** Personal link that signs a participant into one session. Links survive repeated clicks and mail scanners. */
export async function createParticipantToken(participant: Pick<Participant, "id" | "email">, ttlMs = 1000 * 60 * 60 * 24 * 60) {
  const raw = randomBytes(32).toString("base64url");
  await insertToken({
    hash: hashToken(raw),
    purpose: "participant",
    email: participant.email ?? "",
    participantId: participant.id,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

export function appUrl() {
  return appOrigin();
}

export async function participantLink(participant: Pick<Participant, "id" | "email">, locale: string, next?: string) {
  const token = await createParticipantToken(participant);
  const params = new URLSearchParams({ token, locale });
  if (next) params.set("next", next);
  return `${appUrl()}/api/auth/link?${params}`;
}
