import { getTranslations } from "next-intl/server";
import { lineKeys } from "@/components/film/script";
import { toLocale } from "@/lib/i18n-server";
import { prepareLines } from "@/lib/tts";

export const maxDuration = 10;

/** Registers the film's fixed lines in one write and returns their audio URLs. The page does not wait for this. */
export async function GET(request: Request) {
  const locale = toLocale(new URL(request.url).searchParams.get("locale"));
  const t = await getTranslations({ locale, namespace: "film.lines" });
  const spoken = await getTranslations({ locale, namespace: "film.spoken" });
  try {
    const urls = await prepareLines(
      lineKeys.map((key) => ({ key, text: spoken.has(key) ? spoken(key) : t(key), lang: locale })),
    );
    return Response.json(urls, { headers: { "cache-control": "private, max-age=300" } });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : "failed";
    console.error("[tts] film voice", message);
    return Response.json(Object.fromEntries(lineKeys.map((key) => [key, null])), { status: 200 });
  }
}
