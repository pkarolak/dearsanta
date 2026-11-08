"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SpeakerIcon } from "./icons";
import { workshopAudio } from "@/lib/audio/engine";

/** Browsers only allow sound after a tap, so the ceremony begins with one. */
export function useSoundGate(ambience = true) {
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => () => workshopAudio().stopAmbience(), []);

  const enable = async () => {
    const audio = workshopAudio();
    await audio.unlock();
    if (ambience) audio.startAmbience();
    audio.sleighBells(0.8);
    setEnabled(true);
  };

  const toggleMute = () => {
    const next = !muted;
    workshopAudio().setMuted(next);
    setMuted(next);
  };

  return { enabled, enable, muted, toggleMute };
}

export function SoundGateOverlay({ onEnable, compact }: { onEnable: () => void; compact?: boolean }) {
  const t = useTranslations("sound");
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-night/55 backdrop-blur-[2px]">
      <button onClick={onEnable} className={`btn-primary ${compact ? "text-base" : "px-8 py-4 text-xl"}`}>
        <SpeakerIcon className="h-6 w-6" />
        {t("start")}
      </button>
    </div>
  );
}

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  const t = useTranslations("sound");
  return (
    <button onClick={onToggle} className="rounded-full bg-white/10 p-2.5 text-snow hover:bg-white/20" aria-label={muted ? t("unmute") : t("mute")}>
      <SpeakerIcon muted={muted} />
    </button>
  );
}
