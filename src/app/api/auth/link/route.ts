import { NextResponse } from "next/server";
import { hashToken, signInParticipant, signInProfile } from "@/lib/auth";
import { getParticipant, getSessionById, markDevice, updateParticipant, consumeToken } from "@/lib/db/repo";
import { toLocale } from "@/lib/i18n-server";
import { requestOrigin, safeSessionNext } from "@/lib/urls";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = toLocale(url.searchParams.get("locale"));
  const raw = url.searchParams.get("token") ?? "";
  const next = url.searchParams.get("next");
  // The address the browser used: behind `next dev -H 0.0.0.0`, request.url would say 0.0.0.0.
  const origin = await requestOrigin();
  const redirectTo = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, origin));

  const token = raw ? await consumeToken(hashToken(raw)) : null;
  if (!token) return redirectTo("/login?expired=1");

  if (token.purpose === "login") {
    await signInProfile(token.email);
    return redirectTo("/me");
  }

  const participant = token.participantId ? await getParticipant(token.participantId) : null;
  const session = participant ? await getSessionById(participant.sessionId) : null;
  if (!participant || !session) return redirectTo("/login?expired=1");

  // Clicking a personal link proves ownership of the e-mail address.
  await updateParticipant(participant, {
    emailVerified: participant.email ? true : undefined,
    status: participant.status === "invited" ? "approved" : undefined,
  });
  await signInParticipant(session, participant.id);
  if (participant.email) await signInProfile(participant.email);

  const safeNext = safeSessionNext(next, session.code);
  if (participant.role === "host" && safeNext.startsWith(`/s/${session.code}/host`)) await markDevice(session.id, "remote");
  return redirectTo(safeNext);
}
