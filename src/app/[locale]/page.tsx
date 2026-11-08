import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { DrawScene } from "@/components/landing/DrawScene";
import { FinaleScene } from "@/components/landing/FinaleScene";
import { GatherScene } from "@/components/landing/GatherScene";
import { HeroShow } from "@/components/landing/HeroShow";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { LanguagesScene } from "@/components/landing/LanguagesScene";
import { MatchScene } from "@/components/landing/MatchScene";
import { ModesScene } from "@/components/landing/ModesScene";

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <main className="bg-wall">
      <LandingMotion>
        <HeroShow />
        <GatherScene />
        <DrawScene />
        <MatchScene />
        <ModesScene />
        <LanguagesScene />
        <FinaleScene />
      </LandingMotion>
    </main>
  );
}
