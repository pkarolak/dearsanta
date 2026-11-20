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

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "film.lines" });
  // Subtitles only. Recordings load after paint from /api/film-voice, so a slow
  // database cannot hold the document open.
  const lines = Object.fromEntries(
    lineKeys.map((key): [LineKey, VoiceLine] => [key, { id: `film-${key}`, text: t(key), audioUrl: null }]),
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
