import { buildIcs } from "@/lib/calendar";
import { getSessionByCode, listParticipants } from "@/lib/db/repo";
import { calendarEvent } from "@/lib/mail/messages";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSessionByCode(code);
  if (!session) return new Response("Not found", { status: 404 });
  const host = (await listParticipants(session.id)).find((p) => p.role === "host");
  const event = calendarEvent(session, host);
  if (!event) return new Response("This session has no date yet", { status: 404 });
  return new Response(buildIcs(event), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="secret-santa-${session.code}.ics"`,
    },
  });
}
