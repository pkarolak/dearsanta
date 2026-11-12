"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { CeremonyStage } from "./CeremonyStage";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { advanceCeremonyAction } from "@/lib/actions";
import { nextStep } from "@/lib/ceremony/steps";
import type { SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";

type Props = { code: string; screenKey: string | null; initial: SessionState; joinUrl: string };

export function ScreenView({ code, screenKey, initial, joinUrl }: Props) {
  const locale = useLocale();
  const t = useTranslations("host");
  const te = useTranslations("errors");
  const sound = useSoundGate();
  const { state, serverToLocal, refresh } = useSessionState(code, locale, { screenKey, initial, voice: sound.enabled });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!state) return null;

  const upcoming = nextStep(state.session.step);
  const advance = () =>
    start(async () => {
      setError(null);
      const result = await advanceCeremonyAction(code);
      if (!result.ok) {
        const base = te.has(result.error) ? te(result.error) : te("unknown");
        setError(result.detail?.length ? `${base} ${result.detail.join(", ")}` : base);
      }
      await refresh();
    });

  const controls = (
    <div className="flex flex-col items-end gap-[0.6cqw]">
      <div className="flex items-center gap-[0.6cqw]">
        {sound.enabled && <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />}
        <button
          className="btn-soft px-4 py-2 text-sm"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
        >
          {t("fullscreen")}
        </button>
        {state.isHost && upcoming && (
          <button className="btn-primary px-5 py-2" disabled={pending} onClick={advance}>
            {state.session.step === "lobby" ? t("start") : t("next", { step: t(`steps.${upcoming}`) })}
          </button>
        )}
      </div>
      {error && <p className="max-w-sm rounded-2xl bg-berry px-4 py-2 text-sm text-snow">{error}</p>}
    </div>
  );

  return (
    <div className="relative">
      <CeremonyStage
        state={state}
        locale={locale}
        audible={sound.enabled}
        serverToLocal={serverToLocal}
        joinUrl={joinUrl}
        className="h-dvh w-full"
        controls={controls}
      />
      {!sound.enabled && <SoundGateOverlay onEnable={sound.enable} />}
    </div>
  );
}
