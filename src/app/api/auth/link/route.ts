import { NextResponse } from "next/server";
import { hashToken, signInParticipant, signInProfile } from "@/lib/auth";
import { getParticipant, getSessionById, updateParticipant, consumeToken } from "@/lib/db/repo";
import { toLocale } from "@/lib/i18n-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = toLocale(url.searchParams.get("locale"));
  const raw = url.searchParams.get("token") ?? "";
  const next = url.searchParams.get("next");
  const redirectTo = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, url.origin));

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
    emailVerified: true,
    status: participant.status === "invited" ? "approved" : undefined,
  });
  await signInParticipant(session, participant.id);
  await signInProfile(participant.email);

  const safeNext = next && next.startsWith(`/s/${session.code}/`) ? next : `/s/${session.code}/me`;
  return redirectTo(safeNext);
}
