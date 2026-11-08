"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { avatarOptions, type AvatarConfig } from "@/lib/avatar";
import { saveProfileAction } from "@/lib/actions";

type Props = {
  code: string;
  initialName: string;
  initialAvatar: AvatarConfig;
  completed: boolean;
  onSaved?: () => void;
};

const colorKeys = ["skin", "hairColor", "sweater", "scarf", "background"] as const;
const choiceKeys = ["hairStyle", "hat", "glasses"] as const;

export function AvatarEditor({ code, initialName, initialAvatar, completed, onSaved }: Props) {
  const t = useTranslations("elf");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setSaved(false);
    setAvatar((a) => ({ ...a, [key]: value }));
  };

  const randomize = () => {
    const r = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
    setSaved(false);
    setAvatar({
      skin: r(avatarOptions.skin),
      hairStyle: r(avatarOptions.hairStyle),
      hairColor: r(avatarOptions.hairColor),
      hat: r(avatarOptions.hat),
      scarf: r(avatarOptions.scarf),
      glasses: r(avatarOptions.glasses),
      sweater: r(avatarOptions.sweater),
      background: r(avatarOptions.background),
      blush: Math.random() > 0.3,
    });
  };

  return (
    <div className="card p-5 md:p-7">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="h-40 w-40 rounded-full shadow-[0_18px_30px_-14px_rgba(80,45,25,0.5)]">
            <Avatar config={avatar} className="h-full w-full" title={name} />
          </div>
          <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={randomize}>
            {t("surprise")}
          </button>
        </div>
        <div className="w-full flex-1 space-y-4">
          <div>
            <label className="label" htmlFor="elf-name">{t("name")}</label>
            <input
              id="elf-name"
              className="field text-lg"
              value={name}
              maxLength={40}
              onChange={(e) => {
                setSaved(false);
                setName(e.target.value);
              }}
            />
          </div>
          {choiceKeys.map((key) => (
            <div key={key}>
              <span className="label">{t(`options.${key}`)}</span>
              <div className="flex flex-wrap gap-2">
                {avatarOptions[key].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => set(key, value as never)}
                    aria-pressed={avatar[key] === value}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                      avatar[key] === value ? "bg-pine text-white shadow" : "well text-ink/80 hover:text-ink"
                    }`}
                  >
                    {t(`values.${value}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            {colorKeys.map((key) => (
              <div key={key}>
                <span className="label">{t(`options.${key}`)}</span>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions[key].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => set(key, value as never)}
                      aria-label={value === "none" ? t("values.none") : value}
                      aria-pressed={avatar[key] === value}
                      className={`h-8 w-8 rounded-full transition ${avatar[key] === value ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-110"}`}
                      style={{
                        background:
                          value === "none" ? "repeating-linear-gradient(45deg,#eee,#eee 4px,#ddd 4px,#ddd 8px)" : value,
                        boxShadow: "inset -3px -3px 6px rgba(0,0,0,.15), inset 2px 2px 4px rgba(255,255,255,.5)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            <input type="checkbox" checked={avatar.blush} onChange={(e) => set("blush", e.target.checked)} className="h-4 w-4 accent-berry" />
            {t("options.blush")}
          </label>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-berry">{error}</p>}
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span className="text-sm font-semibold text-pine">{t("saved")}</span>}
        <button
          className="btn-primary"
          disabled={pending || !name.trim()}
          onClick={() =>
            start(async () => {
              setError(null);
              const result = await saveProfileAction(code, { displayName: name, avatar }, locale);
              if (result.ok) {
                setSaved(true);
                onSaved?.();
              } else setError(te.has(result.error) ? te(result.error) : te("unknown"));
            })
          }
        >
          {completed ? t("save") : t("create")}
        </button>
      </div>
    </div>
  );
}
