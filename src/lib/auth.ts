import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { findParticipantByEmail, getParticipant, insertToken, normalizeEmail, type Participant, type Session } from "@/lib/db/repo";

const PROFILE_COOKIE = "sh_profile";
const participantCookie = (code: string) => `sh_p_${code.toUpperCase()}`;
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

export async function signInParticipant(session: Pick<Session, "code" | "id">, participantId: string) {
  const jar = await cookies();
  jar.set(participantCookie(session.code), await sign({ pid: participantId, sid: session.id }), cookieOptions);
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
  let participant: Participant | null = null;
  const payload = await verify(jar.get(participantCookie(session.code))?.value);
  if (payload?.sid === session.id && payload.pid) {
    const p = await getParticipant(payload.pid);
    if (p && p.sessionId === session.id) participant = p;
  }
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
export async function createParticipantToken(participant: Pick<Participant, "id" | "email">) {
  const raw = randomBytes(32).toString("base64url");
  await insertToken({
    hash: hashToken(raw),
    purpose: "participant",
    email: participant.email ?? "",
    participantId: participant.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
  });
  return raw;
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function participantLink(participant: Pick<Participant, "id" | "email">, locale: string, next?: string) {
  const token = await createParticipantToken(participant);
  const params = new URLSearchParams({ token, locale });
  if (next) params.set("next", next);
  return `${appUrl()}/api/auth/link?${params}`;
}
