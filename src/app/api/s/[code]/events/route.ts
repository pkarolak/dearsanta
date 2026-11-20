import { getSessionVersion } from "@/lib/db/repo";

export const maxDuration = 25;

const POLL_MS = 2_000;
const STREAM_LIFETIME_MS = 20_000;

/**
 * Server-Sent Events stream announcing session version changes. It watches the version column
 * in Postgres, so it works across serverless instances without a separate realtime service.
 * Browsers reconnect automatically when the stream ends.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const encoder = new TextEncoder();
  let closed = false;
  request.signal.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      send("retry: 1500\n\n");
      const started = Date.now();
      let last: number | null = null;
      let ticks = 0;
      while (!closed && Date.now() - started < STREAM_LIFETIME_MS) {
        try {
          const version = await getSessionVersion(code.toUpperCase());
          if (version === null) {
            send("event: gone\ndata: {}\n\n");
            break;
          }
          if (version !== last) {
            last = version;
            send(`data: ${version}\n\n`);
          } else if (++ticks % 20 === 0) {
            send(": keep-alive\n\n");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message.split("\n")[0] : "failed";
          console.error("[events]", message);
          // A timed-out poll holds a pooler client until it is cancelled. Stop, and let the browser reconnect.
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      closed = true;
      controller.close();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
