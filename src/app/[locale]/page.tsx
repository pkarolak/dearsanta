import { getTranslations, setRequestLocale } from "next-intl/server";
import { FinaleScene } from "@/components/landing/FinaleScene";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { LanguagesScene } from "@/components/landing/LanguagesScene";
import { MatchScene } from "@/components/landing/MatchScene";
import { ModesScene } from "@/components/landing/ModesScene";
import { lineKeys, type LineKey } from "@/components/film/script";
import { StoryFilm } from "@/components/film/StoryFilm";
import { SiteHeader } from "@/components/SiteHeader";
import type { VoiceLine } from "@/lib/audio/engine";
import { prepareLine } from "@/lib/tts";

// Voice URLs are registered in Postgres. A build-time prerender runs before that
// database is reachable and would publish audioUrl: null for the life of the deploy.
export const dynamic = "force-dynamic";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "film.lines" });
  // Santa's voice reads `film.spoken` where the subtitle has something TTS mispronounces, like digits.
  const spoken = await getTranslations({ locale, namespace: "film.spoken" });
  const lines = Object.fromEntries(
    await Promise.all(
      lineKeys.map(async (key): Promise<[LineKey, VoiceLine]> => {
        const text = t(key);
        const voice = spoken.has(key) ? spoken(key) : text;
        return [
          key,
          {
            id: `film-${key}`,
            text,
            audioUrl: await prepareLine(voice, locale).catch((error: unknown) => {
              const message = error instanceof Error ? error.message.split("\n")[0] : "failed";
              console.error("[tts] film line", message);
              return null;
            }),
          },
        ];
      }),
    ),
  ) as Record<LineKey, VoiceLine>;

  return (
    <main className="bg-wall">
      <SiteHeader fixed />
      <LandingMotion>
        <StoryFilm lines={lines} />
        <MatchScene />
        <ModesScene />
        <LanguagesScene />
        <FinaleScene />
      </LandingMotion>
    </main>
  );
}
