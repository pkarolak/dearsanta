"use client";

import { ArrowRight, Shuffle } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar, hasHat } from "./Avatar";
import { WizardHeader } from "./WizardHeader";
import { avatarOptions, genderOf, hairFor, starterAvatar, type AvatarConfig, type ElfGender } from "@/lib/avatar";
import { previewProfileAction, saveProfileAction } from "@/lib/actions";

type Props = {
  code: string;
  initialName: string;
  initialAvatar: AvatarConfig;
  completed: boolean;
  onSaved?: () => void;
  /** Part of the first-visit wizard: who you are is step 1, the look step 2, out of this many. */
  wizardSteps?: number;
};

type Tab = "face" | "hat" | "outfit";
const tabs: Tab[] = ["face", "hat", "outfit"];

type ColorKey = "skin" | "sweater" | "background";
type ChoiceKey = "facial" | "hat" | "glasses";
const genders: ElfGender[] = ["woman", "man"];

/** A sample elf for the "who are you" cards, in this person's current skin tone. */
function sample(gender: ElfGender, skin: AvatarConfig["skin"]): AvatarConfig {
  const hair = gender === "woman" ? "waves" : "short";
  return {
    skin,
    hair,
    facial: gender === "man" ? "beard" : "none",
    hat: hasHat({ hair, skin, hat: "elf" }) ? "elf" : "none",
    glasses: "none",
    sweater: gender === "woman" ? avatarOptions.sweater[0] : avatarOptions.sweater[1],
    background: gender === "woman" ? avatarOptions.background[0] : avatarOptions.background[2],
    blush: true,
  };
}

export function AvatarEditor({ code, initialName, initialAvatar, completed, onSaved, wizardSteps }: Props) {
  const t = useTranslations("elf");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(() => (hasHat(initialAvatar) ? initialAvatar : { ...initialAvatar, hat: "none" }));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A new elf starts by saying who they are, so the first look already fits them.
  const [gender, setGender] = useState<ElfGender | null>(() => (completed ? genderOf(initialAvatar) : null));
  const [allHair, setAllHair] = useState(false);
  const [tab, setTab] = useState<Tab>("face");

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

  const randomize = (who: ElfGender = gender ?? genderOf(avatar)) => {
    setSaved(false);
    setAvatar(starterAvatar(who, hasHat));
  };

  const choose = (who: ElfGender) => {
    setGender(who);
    setAllHair(false);
    setTab("face");
    randomize(who);
  };

  const choices = (key: ChoiceKey) => (
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
  );

  const colors = (key: ColorKey) => (
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
            className={`h-9 w-9 rounded-full transition ${avatar[key] === value ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-110"}`}
            style={{
              background: value,
              boxShadow: "inset -3px -3px 6px rgba(0,0,0,.15), inset 2px 2px 4px rgba(255,255,255,.5)",
            }}
          />
        ))}
      </div>
    </div>
  );

  if (!gender) {
    return (
      <div className="card p-5 md:p-7">
        {wizardSteps ? (
          <WizardHeader step={1} total={wizardSteps} title={t("introTitle")} />
        ) : (
          <h3 className="font-display text-xl font-bold">{t("introTitle")}</h3>
        )}
        <label className="label mt-4" htmlFor="elf-name">{t("name")}</label>
        <input
          id="elf-name"
          className="field text-lg"
          value={name}
          maxLength={40}
          autoComplete="given-name"
          onChange={(e) => setName(e.target.value)}
        />
        <p className="label mt-5">{t("genderLabel")}</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("genderLabel")}>
          {genders.map((who) => (
            <button
              key={who}
              type="button"
              role="radio"
              aria-checked={false}
              disabled={!name.trim()}
              onClick={() => choose(who)}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-snow p-4 ring-2 ring-ink/10 transition enabled:hover:-translate-y-0.5 enabled:hover:ring-pine disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Avatar config={sample(who, avatar.skin)} className="h-24 w-24 shadow-[0_12px_20px_-12px_rgba(80,45,25,0.5)]" />
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                {t(`gender.${who}`)}
                <ArrowRight weight="bold" className="h-4 w-4 text-pine transition-transform group-enabled:group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
        {!name.trim() && <p className="mt-3 text-sm text-muted">{t("introNameFirst")}</p>}
      </div>
    );
  }

  const hairChoices = allHair ? avatarOptions.hair : hairFor[gender];
  const inWizard = !!wizardSteps && !completed;

  return (
    <div className="card p-5 md:p-7">
      {inWizard && <WizardHeader step={2} total={wizardSteps} title={t("lookTitle")} onBack={() => setGender(null)} />}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="h-24 w-24 shrink-0 rounded-full shadow-[0_18px_30px_-14px_rgba(80,45,25,0.5)] sm:h-32 sm:w-32">
          <Avatar config={avatar} className="h-full w-full" title={name} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {inWizard ? (
            <p className="truncate font-display text-2xl font-bold">{name}</p>
          ) : (
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
          )}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-ink/5 p-1" role="radiogroup" aria-label={t("genderLabel")}>
              {genders.map((who) => (
                <button
                  key={who}
                  type="button"
                  role="radio"
                  aria-checked={gender === who}
                  onClick={() => gender !== who && choose(who)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${gender === who ? "bg-pine text-white shadow" : "text-ink/70 hover:text-ink"}`}
                >
                  {t(`gender.${who}`)}
                </button>
              ))}
            </div>
            <button type="button" className="btn-soft px-3 py-1.5 text-sm" onClick={() => randomize()}>
              <Shuffle weight="bold" className="h-4 w-4" />
              {t("surprise")}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-1 rounded-full bg-ink/5 p-1" role="tablist">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-2 py-2 text-sm font-semibold transition ${tab === id ? "bg-snow text-ink shadow" : "text-ink/60 hover:text-ink"}`}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-56 space-y-5" role="tabpanel">
        {tab === "face" && (
          <>
            {colors("skin")}
            <div>
              <span className="label">{t("options.hair")}</span>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                {hairChoices.map((hair) => (
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
              <button type="button" className="mt-2 text-sm font-semibold text-pine underline-offset-2 hover:underline" onClick={() => setAllHair((v) => !v)}>
                {allHair ? t("fewerHair") : t("moreHair")}
              </button>
            </div>
            {(gender === "man" || avatar.facial !== "none") && choices("facial")}
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              <input type="checkbox" checked={avatar.blush} onChange={(e) => set("blush", e.target.checked)} className="h-4 w-4 accent-berry" />
              {t("options.blush")}
            </label>
          </>
        )}
        {tab === "hat" && choices("hat")}
        {tab === "outfit" && (
          <>
            {colors("sweater")}
            {choices("glasses")}
            {colors("background")}
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-berry">{error}</p>}
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && !inWizard && <span className="text-sm font-semibold text-pine">{t("saved")}</span>}
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
          {inWizard && wizardSteps > 2 ? (
            <>
              {t("next")}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </>
          ) : completed ? (
            t("save")
          ) : (
            t("create")
          )}
        </button>
      </div>
    </div>
  );
}
