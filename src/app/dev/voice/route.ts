import { listFrame, nameTakes } from "@/lib/ceremony/script";
import { toLocale, translatorFor } from "@/lib/i18n-server";
import en from "../../../../messages/en.json";
import { recordLines, ttsProvider } from "@/lib/tts";

/**
 * Records Santa's fixed lines and the given names ahead of the party, so the ceremony needs no internet:
 * POST { "locale": "pl", "names": ["Patryk", "Babcia Kasia"] }
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  if (!ttsProvider()) return Response.json({ error: "ELEVENLABS_API_KEY is missing" }, { status: 503 });
  const body = (await req.json()) as { locale?: string; names?: string[] };
  const locale = toLocale(body.locale);
  const names = (body.names ?? []).filter((n) => n.trim());
  const texts = new Set<string>();
  const t = translatorFor(locale, "ceremony");
  for (const key of Object.keys(en.ceremony) as (keyof typeof en.ceremony)[]) {
    const raw = t.raw(key) as string;
    if (!raw.includes("{")) texts.add(t(key));
  }
  for (const key of ["elvesNames", "elvesRemote"] as const) {
    const { before, after } = listFrame(locale, key);
    if (before) texts.add(before);
    if (after) texts.add(after);
  }
  for (const name of names) for (const take of Object.values(nameTakes(locale, name))) texts.add(take);
  const results = await recordLines([...texts], locale);
  return Response.json({ locale, recorded: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok) });
}
