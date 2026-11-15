"use client";

import { Broadcast, PencilSimple, Television } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Avatar } from "./Avatar";
import { AvatarEditor } from "./AvatarEditor";
import { CeremonyStage } from "./CeremonyStage";
import { FestiveLinks } from "./FestiveLinks";
import { RevealCard } from "./RevealCard";
import { PageBand } from "./PageBand";
import { WizardHeader } from "./WizardHeader";
import { SantaPuppet } from "./show/SantaPuppet";
import { Cast, Vignette } from "./show/Vignette";
import { MuteButton, useSoundGate } from "./SoundControls";
import { SpeakerIcon } from "./icons";
import { BrandMark } from "./BrandMark";
import { Link } from "@/i18n/navigation";
import { ceremonySteps } from "@/lib/ceremony/steps";
import { markRevealedAction, setRemoteAction } from "@/lib/actions";
import type { SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";
import { brand } from "@/lib/brand";

export function ElfRoom({ code, initial }: { code: string; initial: SessionState }) {
  const locale = useLocale();
  const t = useTranslations("elf");
  const sound = useSoundGate();
  const ts = useTranslations("sound");
  const wide = useWide();
  const { state, serverToLocal, refresh } = useSessionState(code, locale, { initial, voice: sound.enabled });
  const [pending, start] = useTransition();
  // A first visit is a short wizard: who you are, your elf's look, then where you watch from.
  const [phase, setPhase] = useState<"elf" | "where" | "done">(() => (initial.viewer?.profileComplete ? "done" : "elf"));
  const [editing, setEditing] = useState(false);
  if (!state) return null;

  const me = state.viewer!;
  const s = state.session;
  const budget =
    s.budgetAmount !== null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: s.currency, maximumFractionDigits: 2 }).format(s.budgetAmount)
      : null;

  if (me.status !== "approved") {
    return (
      <main className="felt-texture flex min-h-dvh flex-col items-center justify-center px-5 py-10 text-center">
        <Vignette set="home" focus="45% 50%" className="aspect-[4/3] w-full max-w-sm">
          <SantaPuppet className="absolute left-[22%] top-[10%] w-[56%] animate-sway" />
          <Cast who="presents" className="-bottom-[8%] left-[4%] w-[92%]" />
        </Vignette>
        <h1 className="mt-8 font-display text-3xl font-bold">{me.status === "rejected" ? t("rejectedTitle") : t("waitingTitle", { name: me.displayName })}</h1>
        <p className="mt-2 max-w-sm text-muted">{me.status === "rejected" ? t("rejectedBody") : t("waitingBody")}</p>
        <p className="mt-6 text-sm text-muted">{s.title} · {s.code}</p>
      </main>
    );
  }

  const isRemote = me.isRemote && s.mode === "sync";
  const team = state.participants.filter((p) => p.plays);
  const late = s.drawn && !me.inDraw;
  const ceremonyRunning = s.mode === "sync" && s.step !== "lobby";
  const asksWhere = s.mode === "sync" && !s.drawn;
  const wizard = state.assignment || late ? null : phase === "where" && !asksWhere ? null : phase === "done" ? null : phase;
  const setRemote = (remote: boolean, then?: () => void) =>
    start(async () => {
      if (remote !== me.isRemote) await setRemoteAction(code, me.id, remote);
      await refresh();
      then?.();
    });

  const whereChoice = (big: boolean) => (
    <div className={`grid gap-3 ${big ? "" : "sm:grid-cols-2"}`} role="radiogroup" aria-label={t("whereTitle")}>
      {[
        { remote: false, Icon: Television, label: t("imHere"), hint: ceremonyRunning ? t("watchScreen") : t("inRoomHint") },
        { remote: true, Icon: Broadcast, label: t("notInRoom"), hint: t("remoteHint") },
      ].map(({ remote, Icon, label, hint }) => {
        const on = !big && me.isRemote === remote;
        return (
          <button
            key={label}
            role="radio"
            aria-checked={on}
            onClick={() => setRemote(remote, big ? () => setPhase("done") : undefined)}
            disabled={pending}
            className={`flex items-start gap-3 rounded-2xl text-left ring-2 transition ${big ? "p-5" : "p-4"} ${
              on ? "bg-pine text-snow ring-pine" : "bg-snow text-ink ring-ink/10 hover:ring-pine/50"
            }`}
          >
            <Icon weight={on ? "fill" : "bold"} className={`mt-0.5 shrink-0 ${big ? "h-9 w-9" : "h-7 w-7"} ${on ? "text-gold" : "text-pine"}`} />
            <span>
              <span className={`block font-semibold ${big ? "text-lg" : ""}`}>{label}</span>
              <span className={`mt-0.5 block text-sm ${on ? "text-snow/85" : "text-muted"}`}>{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const band = (
    <PageBand title={t("hello", { name: me.displayName })} lead={s.title} cast="elves">
      {state.isHost && (
        <Link href={`/s/${code}/host`} className="btn-soft mt-5 px-4 py-2 text-sm">{t("hostPanel")}</Link>
      )}
    </PageBand>
  );

  const steps = asksWhere ? 3 : 2;
  const panel = wizard ? (
    <div className="space-y-6">
      {wizard === "elf" ? (
        <AvatarEditor
          code={code}
          initialName={me.displayName}
          initialAvatar={me.avatar}
          completed={false}
          wizardSteps={steps}
          onSaved={() => {
            void refresh();
            setPhase(asksWhere ? "where" : "done");
          }}
        />
      ) : (
        <section className="card p-5 md:p-7">
          <WizardHeader step={3} total={steps} title={t("whereTitle")} onBack={() => setPhase("elf")} />
          {whereChoice(true)}
        </section>
      )}
    </div>
  ) : (
    <div className="space-y-6">

      {state.assignment && (s.mode === "sync" ? (
        <RevealCard
          receiver={state.assignment.receiver}
          budget={budget}
          initiallyRevealed={state.assignment.revealed}
          onReveal={() => void markRevealedAction(code)}
        />
      ) : (
        <div className="card p-6 text-center">
          <p className="font-display text-2xl font-bold">{t("drawDone")}</p>
          <Link href={`/s/${code}/reveal`} className="btn-primary mt-4">{t("watchReveal")}</Link>
        </div>
      ))}

      {s.mode === "sync" && !state.assignment && (
        <section className={`card flex items-center gap-4 p-5 ${late ? "" : "border-2 border-dashed border-pine/30"}`}>
          <Image
            src="/show/stocking.webp"
            alt=""
            width={420}
            height={899}
            unoptimized
            className={`w-12 shrink-0 ${late ? "opacity-40 grayscale" : "animate-sway"}`}
          />
          <div>
            <h2 className="font-display text-xl font-bold">{late ? t("lateTitle") : t("matchSoonTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{late ? t("lateBody") : s.drawn ? t("matchSoonDrawn") : ceremonyRunning ? t("matchSoonLive") : t("matchSoonLobby")}</p>
          </div>
        </section>
      )}

      {s.mode === "sync" && s.step === "farewell" && <FestiveLinks />}

      {s.mode === "sync" && !state.assignment && !late && !isRemote && (
        <section className="card p-5">
          <h2 className="mb-3 font-display text-xl font-bold">{t("whereTitle")}</h2>
          {whereChoice(false)}
        </section>
      )}

      {s.mode === "async" && !s.drawn && me.profileComplete && (
        <div className="well px-5 py-4 text-sm">{t("asyncWaiting")}</div>
      )}

      {!state.assignment &&
        (editing ? (
          <section>
            <h2 className="mb-3 font-display text-2xl font-bold">{t("yourElf")}</h2>
            <AvatarEditor
              code={code}
              initialName={me.displayName}
              initialAvatar={me.avatar}
              completed
              onSaved={() => {
                void refresh();
                setEditing(false);
              }}
            />
          </section>
        ) : (
          <section className="card flex items-center gap-4 p-4">
            <Avatar config={me.avatar} className="h-16 w-16 shrink-0" title={me.displayName} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{t("yourElf")}</p>
              <p className="truncate font-display text-xl font-bold">{me.displayName}</p>
            </div>
            <button type="button" className="btn-soft px-4 py-2 text-sm" onClick={() => setEditing(true)}>
              <PencilSimple weight="bold" className="h-4 w-4" />
              {t("changeLook")}
            </button>
          </section>
        ))}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t("team", { count: team.length })}</h2>
        <ul className="flex flex-wrap gap-2">
          {team.map((p) => (
            <li
              key={p.id}
              title={p.profileComplete ? undefined : t("dressing")}
              className={`well flex items-center gap-2 py-1 pl-1 pr-3 text-sm ${p.profileComplete ? "" : "opacity-60"}`}
            >
              <Avatar config={p.avatar} className="h-7 w-7" />
              {p.displayName}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  if (!isRemote) {
    return (
      <main className="felt-texture min-h-dvh pb-12">
        {band}
        <div className="mx-auto max-w-2xl px-5 pt-8">{panel}</div>
      </main>
    );
  }

  // Remote elves watch Santa's broadcast like a live show: the stage up front, their own things in a side panel.
  return (
    <main className="min-h-dvh bg-[radial-gradient(110%_70%_at_30%_0%,#5c1a21_0%,#2b0f13_55%,#160a0b_100%)] lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_25rem] lg:overflow-hidden">
      <section className="sticky top-0 z-20 bg-[#1c0b0d]/95 pb-3 backdrop-blur-md lg:static lg:flex lg:flex-col lg:justify-center lg:bg-transparent lg:px-10 lg:py-6 lg:backdrop-blur-none">
        <div className="mx-auto w-full lg:max-w-[calc((100dvh-11rem)*16/9)]">
          <header className="flex items-center justify-between gap-3 px-4 py-2.5 text-snow lg:px-0 lg:pb-4 lg:pt-0">
            <Link href="/" className="flex items-center gap-2 font-display text-base font-bold lg:text-lg">
              <BrandMark className="h-7 w-7 lg:h-8 lg:w-8" />
              {brand.name}
            </Link>
            <p className="flex items-center gap-2 rounded-full bg-snow/10 py-1 pl-2.5 pr-3 text-xs font-semibold ring-1 ring-snow/15 lg:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-berry opacity-75 motion-reduce:animate-none" />
                <span className="relative h-2 w-2 rounded-full bg-[#ff4757]" />
              </span>
              <span className="uppercase tracking-[0.14em]">{t("live")}</span>
              <span className="text-snow/60 max-sm:hidden">· {t("liveFrom")}</span>
            </p>
          </header>
          <div className="relative overflow-hidden lg:aspect-video lg:rounded-2xl lg:shadow-[0_50px_90px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(242_185_53/0.28)]">
            <CeremonyStage
              state={state}
              locale={locale}
              audible={sound.enabled}
              serverToLocal={serverToLocal}
              compact={!wide}
              captionsBelow={!wide}
              className={wide ? "absolute inset-0" : ""}
              controls={sound.enabled ? <MuteButton muted={sound.muted} onToggle={sound.toggleMute} /> : undefined}
            />
            {!sound.enabled && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#140809]/60 px-6 text-center text-snow backdrop-blur-[3px]">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold lg:text-xs">{t("liveFrom")}</p>
                <p className="mt-1.5 font-display text-lg font-bold leading-tight lg:mt-3 lg:text-3xl">{t("gateTitle")}</p>
                <p className="mt-1 max-w-md text-xs text-snow/75 max-sm:hidden lg:mt-2 lg:text-base">{t("gateBody")}</p>
                <button onClick={sound.enable} className="btn-primary mt-3 px-5 py-2.5 text-sm lg:mt-6 lg:px-7 lg:py-3.5 lg:text-base">
                  <SpeakerIcon className="h-5 w-5" />
                  {ts("start")}
                </button>
              </div>
            )}
          </div>
          <ChapterStrip step={s.step} />
        </div>
      </section>

      <aside className="bg-snow lg:overflow-y-auto lg:rounded-l-[2rem] lg:shadow-[-30px_0_60px_-30px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-4 px-5 pb-2 pt-6">
          <Avatar config={me.avatar} className="h-14 w-14 shrink-0 shadow-[0_10px_20px_-10px_rgba(80,45,25,0.5)]" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">{t("hello", { name: me.displayName })}</h1>
            <p className="truncate text-sm text-muted">{s.title}</p>
          </div>
        </div>
        {state.isHost && (
          <div className="px-5">
            <Link href={`/s/${code}/host`} className="btn-soft mt-2 px-4 py-2 text-sm">{t("hostPanel")}</Link>
          </div>
        )}
        <div className="px-5 pb-8 pt-4">
          {panel}
          {s.mode === "sync" && !state.assignment && !late && (
            <p className="mt-6 text-center text-sm text-muted">
              {t("switchToRoom")}{" "}
              <button type="button" disabled={pending} onClick={() => setRemote(false)} className="font-semibold text-pine underline-offset-2 hover:underline">
                {t("switchToRoomAction")}
              </button>
            </p>
          )}
        </div>
      </aside>
    </main>
  );
}

/** Where the ceremony has got to: one segment per chapter, the current one lit. */
function ChapterStrip({ step }: { step: (typeof ceremonySteps)[number] }) {
  const t = useTranslations("elf");
  const th = useTranslations("host");
  const at = ceremonySteps.indexOf(step);
  return (
    <div className="px-4 pt-3 text-snow lg:px-0 lg:pt-5">
      <div className="flex items-baseline justify-between text-xs lg:hidden">
        <span className="font-semibold">{th(`steps.${step}`)}</span>
        <span className="text-snow/55">{t("chapterOf", { n: at + 1, total: ceremonySteps.length })}</span>
      </div>
      <ol className="mt-1.5 flex gap-1.5 lg:mt-0 lg:gap-2">
        {ceremonySteps.map((id, i) => (
          <li key={id} className="flex-1">
            <span className={`block h-1 rounded-full transition-colors lg:h-1.5 ${i < at ? "bg-gold/70" : i === at ? "bg-gold" : "bg-snow/15"}`} />
            <span className={`mt-2 hidden text-xs font-semibold lg:block ${i === at ? "text-gold" : i < at ? "text-snow/70" : "text-snow/40"}`}>{th(`steps.${id}`)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const wideQuery = "(min-width: 1024px)";
/** Big screens get the show's regular lettering; phones the larger, compact one. */
function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(wideQuery);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(wideQuery).matches,
    () => false,
  );
}
