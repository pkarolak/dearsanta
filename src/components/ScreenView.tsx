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
  const { state, serverToLocal, refresh } = useSessionState(code, locale, { screenKey, initial });
  const sound = useSoundGate();
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

  return (
    <div className="relative">
      <CeremonyStage state={state} locale={locale} audible={sound.enabled} serverToLocal={serverToLocal} joinUrl={joinUrl}>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4">
          <div className="pointer-events-auto flex gap-2">
            {sound.enabled && <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />}
            <button
              className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-snow hover:bg-white/20"
              onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
            >
              {t("fullscreen")}
            </button>
          </div>
          {state.isHost && upcoming && (
            <div className="pointer-events-auto flex flex-col items-end gap-2">
              {error && <p className="max-w-sm rounded-2xl bg-berry px-4 py-2 text-sm text-white">{error}</p>}
              <button className="btn-primary" disabled={pending} onClick={advance}>
                {state.session.step === "lobby" ? t("start") : t("next", { step: t(`steps.${upcoming}`) })}
              </button>
            </div>
          )}
        </div>
      </CeremonyStage>
      {!sound.enabled && <SoundGateOverlay onEnable={sound.enable} />}
    </div>
  );
}
