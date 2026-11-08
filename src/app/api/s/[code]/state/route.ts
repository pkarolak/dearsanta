import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getSessionByCode, updateParticipant } from "@/lib/db/repo";
import { toLocale } from "@/lib/i18n-server";
import { buildState } from "@/lib/state";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const session = await getSessionByCode(code);
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const viewer = await getViewer(session, url.searchParams.get("screen"));
  if (!viewer.participant && !viewer.isScreen) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (viewer.participant) {
    const last = viewer.participant.lastSeenAt?.getTime() ?? 0;
    // Presence changes bump the version so the Elf Chief sees who is online.
    if (Date.now() - last > 20_000) await updateParticipant(viewer.participant, { lastSeenAt: new Date() }, last === 0);
  }

  const state = await buildState(session, viewer, toLocale(url.searchParams.get("locale")));
  return NextResponse.json(state, { headers: { "cache-control": "no-store" } });
}
