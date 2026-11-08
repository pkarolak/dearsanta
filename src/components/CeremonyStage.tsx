"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Avatar } from "./Avatar";
import { GiftIcon, RemoteIcon } from "./icons";
import { NightScene } from "./NightScene";
import { Santa } from "./Santa";
import { useMouth, useVoice } from "./useVoice";
import type { SessionState } from "@/lib/state";

type Props = {
  state: SessionState;
  locale: string;
  audible: boolean;
  serverToLocal: (ms: number) => number;
  joinUrl?: string;
  compact?: boolean;
  /** Extra overlay, e.g. host controls on the big screen. */
  children?: React.ReactNode;
};

export function CeremonyStage({ state, locale, audible, serverToLocal, joinUrl, compact, children }: Props) {
  const t = useTranslations("stage");
  const step = state.session.step;
  const { current } = useVoice(state.script, serverToLocal(state.session.stepStartedAt), audible, locale);
  const mouth = useMouth(!!current);
  const elves = state.participants.filter((p) => p.status === "approved");
  const budget =
    state.session.budgetAmount !== null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: state.session.currency, maximumFractionDigits: 0 }).format(
          state.session.budgetAmount,
        )
      : null;

  const santaSize = compact ? "w-40" : step === "lobby" ? "w-[min(34vw,420px)]" : "w-[min(40vw,480px)]";

  return (
    <NightScene className={compact ? "h-full min-h-[320px] rounded-[1.75rem]" : "min-h-dvh"}>
      <div className={`flex h-full flex-col ${compact ? "p-4" : "p-6 md:p-10"}`}>
        <header className="flex items-center justify-between gap-4">
          <p className={`font-display italic text-snow/80 ${compact ? "text-base" : "text-xl md:text-2xl"}`}>{state.session.title}</p>
          <p className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-snow/80">
            {t(`steps.${step}`)}
          </p>
        </header>

        <div className={`flex flex-1 items-center justify-center gap-8 ${compact ? "flex-col gap-3 py-2" : "flex-col py-6 lg:flex-row lg:gap-16"}`}>
          <motion.div
            layout
            className={`${santaSize} shrink-0`}
            animate={{ y: current ? [0, -4, 0] : [0, -8, 0] }}
            transition={{ duration: current ? 0.6 : 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Santa mouth={mouth} mood={step === "farewell" && !current ? "wink" : "happy"} className="h-auto w-full drop-shadow-2xl" />
          </motion.div>

          {!compact && (
            <div className="flex w-full max-w-xl flex-col items-center gap-6">
              <StepVisual step={step} state={state} elves={elves} budget={budget} joinUrl={joinUrl} />
            </div>
          )}
          {compact && step === "draw" && <ShuffleTags names={elves.map((e) => e.displayName)} small />}
        </div>

        <div className={`flex justify-center ${compact ? "min-h-16" : "min-h-28"}`}>
          <AnimatePresence mode="wait">
            {current && (
              <motion.p
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className={`max-w-3xl relative z-10 rounded-3xl bg-night/85 px-6 py-3 ring-1 ring-snow/10 text-center font-display leading-snug text-snow shadow-xl backdrop-blur ${
                  compact ? "text-base" : "text-2xl md:text-3xl"
                }`}
                aria-live="polite"
              >
                {current.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        {children}
      </div>
    </NightScene>
  );
}

function StepVisual({
  step,
  state,
  elves,
  budget,
  joinUrl,
}: {
  step: SessionState["session"]["step"];
  state: SessionState;
  elves: SessionState["participants"];
  budget: string | null;
  joinUrl?: string;
}) {
  const t = useTranslations("stage");

  if (step === "lobby") {
    return (
      <>
        {joinUrl && (
          <div className="clay-night flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-left">
            <div className="rounded-2xl bg-snow p-3">
              <QRCodeSVG value={joinUrl} size={168} fgColor="#142033" bgColor="#fdfaf6" level="M" />
            </div>
            <div>
              <p className="font-display text-2xl">{t("scanToJoin")}</p>
              <p className="mt-2 text-sm text-snow/70">{t("orEnterCode")}</p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-gold">{state.session.code}</p>
              <p className="mt-2 break-all text-xs text-snow/60">{joinUrl.replace(/^https?:\/\//, "").replace(/\/join\/.*/, "")}</p>
            </div>
          </div>
        )}
        <AvatarRow elves={elves} />
        <p className="text-sm text-snow/70">{t("elvesReady", { count: elves.length })}</p>
      </>
    );
  }

  if (step === "elves" || step === "welcome") return <AvatarRow elves={elves} big={step === "elves"} />;

  if (step === "rules") {
    return (
      <div className="grid w-full gap-4 sm:grid-cols-2">
        <div className="clay-night p-6 text-center">
          <p className="text-sm uppercase tracking-widest text-snow/60">{t("budgetLabel")}</p>
          <p className="mt-2 font-display text-4xl text-gold">{budget ?? t("noBudget")}</p>
        </div>
        <div className="clay-night p-6 text-center">
          <p className="text-sm uppercase tracking-widest text-snow/60">{t("ruleLabel")}</p>
          <p className="mt-2 font-display text-xl">{t("ruleSecret")}</p>
        </div>
      </div>
    );
  }

  if (step === "draw") return <ShuffleTags names={elves.map((e) => e.displayName)} />;

  if (step === "reveal") {
    const progress = state.revealProgress;
    return (
      <div className="clay-night flex flex-col items-center gap-3 p-8 text-center">
        <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} >
          <GiftIcon className="h-20 w-20" />
        </motion.div>
        <p className="font-display text-3xl">{t("lookAtDevice")}</p>
        {progress && progress.total > 0 && (
          <p className="text-snow/70">{t("revealed", { revealed: progress.revealed, total: progress.total })}</p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-display text-5xl italic text-gold md:text-6xl">{t("merry")}</p>
      <div className="mt-6">
        <AvatarRow elves={elves} />
      </div>
    </div>
  );
}

function AvatarRow({ elves, big }: { elves: SessionState["participants"]; big?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <AnimatePresence>
        {elves.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ delay: big ? i * 0.25 : 0, type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`${big ? "h-24 w-24" : "h-16 w-16"} relative rounded-full ring-4 ring-white/15`}>
              <Avatar config={e.avatar} className="h-full w-full" title={e.displayName} />
              {e.isRemote && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-gold px-1.5 p-1 text-night">
                  <RemoteIcon className="h-3 w-3" />
                </span>
              )}
            </div>
            <span className={`max-w-24 truncate ${big ? "text-base" : "text-xs"} text-snow/85`}>{e.displayName}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ShuffleTags({ names, small }: { names: string[]; small?: boolean }) {
  const t = useTranslations("stage");
  const radius = small ? 70 : 150;
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        style={{ width: radius * 2 + 60, height: radius * 2 + 60 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {names.map((name, i) => {
          const angle = (i / names.length) * Math.PI * 2;
          return (
            <motion.div
              key={name + i}
              className="absolute rounded-xl bg-snow px-3 py-1.5 text-sm font-semibold text-berry shadow-lg"
              style={{ left: radius + 30 + Math.cos(angle) * radius, top: radius + 30 + Math.sin(angle) * radius, x: "-50%", y: "-50%" }}
              animate={{ scale: [1, 1.12, 1], rotate: [-6, 6, -6] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            >
              {small ? name.slice(0, 1) : name}
            </motion.div>
          );
        })}
        <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-gold/30 blur-2xl" />
      </motion.div>
      {!small && <p className="font-display text-2xl text-snow/90">{t("drawing")}</p>}
    </div>
  );
}
