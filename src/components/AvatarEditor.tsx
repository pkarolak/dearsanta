"use client";

import { Shuffle } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar, hasHat } from "./Avatar";
import { avatarOptions, type AvatarConfig } from "@/lib/avatar";
import { previewProfileAction, saveProfileAction } from "@/lib/actions";

type Props = {
  code: string;
  initialName: string;
  initialAvatar: AvatarConfig;
  completed: boolean;
  onSaved?: () => void;
};

const colorKeys = ["skin", "sweater", "background"] as const;
const choiceKeys = ["facial", "hat", "glasses"] as const;

export function AvatarEditor({ code, initialName, initialAvatar, completed, onSaved }: Props) {
  const t = useTranslations("elf");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(() => (hasHat(initialAvatar) ? initialAvatar : { ...initialAvatar, hat: "none" }));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Everyone in the room watches the elves take shape on the big screen, so every tweak goes out right away.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => void previewProfileAction(code, { displayName: name.trim() || undefined, avatar }), 250);
    return () => clearTimeout(timer);
  }, [code, name, avatar]);

  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setSaved(false);
    setAvatar((a) => {
      const next = { ...a, [key]: value };
      return hasHat(next) ? next : { ...next, hat: "none" };
    });
  };

  const randomize = () => {
    const r = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
    setSaved(false);
    const hair = r(avatarOptions.hair);
    const skin = r(avatarOptions.skin);
    setAvatar({
      skin,
      hair,
      facial: Math.random() < 0.35 ? r(avatarOptions.facial) : "none",
      hat: r(avatarOptions.hat.filter((hat) => hasHat({ hair, skin, hat }))),
      glasses: Math.random() < 0.25 ? "round" : "none",
      sweater: r(avatarOptions.sweater),
      background: r(avatarOptions.background),
      blush: Math.random() > 0.3,
    });
  };

  return (
    <div className="card p-5 md:p-7">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="sticky top-3 z-10 flex flex-col items-center gap-3 sm:static">
          <div className="h-40 w-40 rounded-full shadow-[0_18px_30px_-14px_rgba(80,45,25,0.5)]">
            <Avatar config={avatar} className="h-full w-full" title={name} />
          </div>
          <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={randomize}>
            <Shuffle weight="bold" className="h-4 w-4" />
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
          <div>
            <span className="label">{t("options.hair")}</span>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {avatarOptions.hair.map((hair) => (
                <button
                  type="button"
                  key={hair}
                  onClick={() => set("hair", hair)}
                  aria-label={t(`hair.${hair}`)}
                  title={t(`hair.${hair}`)}
                  aria-pressed={avatar.hair === hair}
                  className={`rounded-full transition ${avatar.hair === hair ? "ring-[3px] ring-pine ring-offset-2 ring-offset-paper" : "hover:scale-105"}`}
                >
                  <Avatar config={{ ...avatar, hair, facial: "none", hat: "none", glasses: "none" }} className="w-full" />
                </button>
              ))}
            </div>
          </div>
          {choiceKeys.map((key) => (
            <div key={key}>
              <span className="label">{t(`options.${key}`)}</span>
              <div className="flex flex-wrap gap-2">
                {avatarOptions[key].map((value) => {
                  const missing = key === "hat" && !hasHat({ ...avatar, hat: value as AvatarConfig["hat"] });
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => set(key, value as never)}
                      disabled={missing}
                      title={missing ? t("hatMissing") : undefined}
                      aria-pressed={avatar[key] === value}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                        avatar[key] === value ? "bg-pine text-white shadow" : "well text-ink/80 enabled:hover:text-ink"
                      }`}
                    >
                      {t(`values.${value}`)}
                    </button>
                  );
                })}
              </div>
              {key === "hat" && avatarOptions.hat.some((hat) => !hasHat({ ...avatar, hat })) && (
                <p className="mt-1.5 text-xs text-muted">{t("hatMissing")}</p>
              )}
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
                      aria-label={value}
                      aria-pressed={avatar[key] === value}
                      className={`h-8 w-8 rounded-full transition ${avatar[key] === value ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-110"}`}
                      style={{
                        background: value,
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
