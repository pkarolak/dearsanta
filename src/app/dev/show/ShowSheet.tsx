"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { FestiveLinks } from "@/components/FestiveLinks";
import { BudgetBoard, JoinBoard } from "@/components/show/BoardCards";
import { ShowFrame, ShowStage } from "@/components/show/ShowStage";
import { Reindeer } from "@/components/show/Vignette";
import { avatarOptions, defaultAvatar, seededAvatar } from "@/lib/avatar";
import { ceremonySteps, type CeremonyStep } from "@/lib/ceremony/steps";

const names = ["Anna", "Tom", "Ola", "Kasia", "Marek", "Lucía", "João", "Grete", "Piotr", "Sam", "Zofia", "Ben"];

const sampleLines: Record<CeremonyStep, string> = {
  lobby: "Ho, ho, ho! Come in, come in, and warm your hands by the fire.",
  welcome: "Welcome to my living room, dear elves!",
  elves: "Let me see who came tonight… Anna! Tom! Ola!",
  rules: "Each of you will secretly get one person to surprise with a gift.",
  draw: "Now, let me shuffle the names…",
  reveal: "Look at your own device, and hold it close to your heart.",
  farewell: "Merry Christmas, my dear elves!",
};

export function ShowSheet({ step, count, level, draw: wanted }: { step: string | null; count: number; level: number; draw?: "spinning" | "stopped" | "sequence" }) {
  // "sequence" plays the whole draw: seven seconds of spinning, then the stop.
  const [stoppedNow, setStoppedNow] = useState(false);
  useEffect(() => {
    if (wanted !== "sequence") return;
    const timer = setTimeout(() => setStoppedNow(true), 7000);
    return () => clearTimeout(timer);
  }, [wanted]);
  const draw = wanted === "sequence" ? (stoppedNow ? "stopped" : "spinning") : wanted;
  const elves = Array.from({ length: count }, (_, i) => names[i] ?? `Elf ${i + 1}`).map((displayName, i) => ({
    id: String(i),
    displayName,
    avatar: seededAvatar(displayName),
    isRemote: i === 1,
  }));

  const stage = (s: CeremonyStep) => (
    <ShowStage
      step={s}
      title="Family Christmas"
      stepLabel={s}
      elves={elves}
      level={level}
      draw={draw}
      farewellExtras={<FestiveLinks variant="stage" />}
      subtitle={{ id: s, text: sampleLines[s] }}
      card={
        s === "lobby" ? (
          <JoinBoard url="http://localhost:3000/en/join/YWXVT8" code="YWXVT8" title="Scan to join Santa’s workshop" hint="or open the site and enter the code" />
        ) : s === "rules" ? (
          <BudgetBoard label="Gift budget" budget="£100" note="Keep it secret until the gifts are opened" />
        ) : null
      }
      stageText={s === "reveal" ? { title: "Look at your own device", detail: "2 of 5 elves have unwrapped their match" } : { title: "Merry Christmas!" }}
    />
  );

  if (step && (ceremonySteps as readonly string[]).includes(step)) {
    return <ShowFrame className="h-dvh w-full">{stage(step as CeremonyStep)}</ShowFrame>;
  }

  return (
    <main className="space-y-10 bg-snow p-8">
      <section data-testid="reindeer" className="relative h-[480px] w-[360px] bg-pine">
        <Reindeer className="inset-0 w-full">
          <QRCodeSVG value="https://example.com/join/ABCD" className="mx-auto h-[92%] w-auto translate-y-[4%]" />
        </Reindeer>
      </section>
      <section data-testid="avatar-matrix" className="grid grid-cols-10 gap-2">
        {avatarOptions.hair.flatMap((hair, si) =>
          avatarOptions.hat.flatMap((hat, hi) =>
            [avatarOptions.skin[4], avatarOptions.skin[0]].map((skin, k) => (
              <Avatar
                key={`${hair}-${hat}-${k}`}
                config={{
                  ...defaultAvatar,
                  skin,
                  hair,
                  hat,
                  facial: avatarOptions.facial[(si + hi + k) % 4],
                  glasses: (si + hi + k) % 3 ? "none" : "round",
                  sweater: avatarOptions.sweater[(hi + k) % 5],
                  background: avatarOptions.background[si % 5],
                }}
                className="h-auto w-full"
              />
            )),
          ),
        )}
      </section>
      <section className="grid grid-cols-6 gap-4">
        {names.concat(["Eli", "Noa", "Ida", "Max", "Leo", "Mia"]).map((n) => (
          <div key={n} className="text-center">
            <Avatar config={seededAvatar(n)} className="h-auto w-full" title={n} />
            <p className="mt-1 text-sm">{n}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        {ceremonySteps.map((s) => (
          <ShowFrame key={s} className="aspect-video w-full">
            {stage(s)}
          </ShowFrame>
        ))}
      </section>
    </main>
  );
}
