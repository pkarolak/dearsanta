import { listFrame, nameTakes } from "@/lib/ceremony/script";
import { toLocale } from "@/lib/i18n-server";
import { recordLines, ttsProvider } from "@/lib/tts";

/**
 * Records names ahead of the party, so Santa can read the roll call even without internet:
 * POST { "locale": "pl", "names": ["Patryk", "Babcia Kasia"] }
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  if (!ttsProvider()) return Response.json({ error: "ELEVENLABS_API_KEY is missing" }, { status: 503 });
  const body = (await req.json()) as { locale?: string; names?: string[] };
  const locale = toLocale(body.locale);
  const names = (body.names ?? []).filter((n) => n.trim());
  const texts = new Set<string>();
  for (const key of ["elvesNames", "elvesRemote"] as const) {
    const { before, after } = listFrame(locale, key);
    if (before) texts.add(before);
    if (after) texts.add(after);
  }
  for (const name of names) for (const take of Object.values(nameTakes(locale, name))) texts.add(take);
  const results = await recordLines([...texts], locale);
  return Response.json({ locale, recorded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok) });
}
