import { getTranslations } from "next-intl/server";
import { lineKeys } from "@/components/film/script";
import { toLocale } from "@/lib/i18n-server";
import { prepareLine } from "@/lib/tts";

export const maxDuration = 10;

/** Registers the film's lines and returns their audio URLs. The page does not wait for this. */
export async function GET(request: Request) {
  const locale = toLocale(new URL(request.url).searchParams.get("locale"));
  const t = await getTranslations({ locale, namespace: "film.lines" });
  const spoken = await getTranslations({ locale, namespace: "film.spoken" });
  const entries = await Promise.all(
    lineKeys.map(async (key) => {
      const voice = spoken.has(key) ? spoken(key) : t(key);
      const audioUrl = await prepareLine(voice, locale).catch((error: unknown) => {
        const message = error instanceof Error ? error.message.split("\n")[0] : "failed";
        console.error("[tts] film line", message);
        return null;
      });
      return [key, audioUrl] as const;
    }),
  );
  return Response.json(Object.fromEntries(entries), {
    headers: { "cache-control": "private, max-age=300" },
  });
}
