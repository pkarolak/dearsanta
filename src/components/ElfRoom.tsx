"use client";

import { Broadcast, PencilSimple, Television } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { AvatarEditor } from "./AvatarEditor";
import { CeremonyStage } from "./CeremonyStage";
import { FestiveLinks } from "./FestiveLinks";
import { RevealCard } from "./RevealCard";
import { PageBand } from "./PageBand";
import { WizardHeader } from "./WizardHeader";
import { SantaPuppet } from "./show/SantaPuppet";
import { Cast, Vignette } from "./show/Vignette";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { Link } from "@/i18n/navigation";
import { markRevealedAction, setRemoteAction } from "@/lib/actions";
import type { SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";

export function ElfRoom({ code, initial }: { code: string; initial: SessionState }) {
  const locale = useLocale();
  const t = useTranslations("elf");
  const sound = useSoundGate();
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

      {s.mode === "sync" && !state.assignment && !late && (
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
        <h2 className="mb-3 font-display text-xl font-bold">{t("team", { count: state.participants.length })}</h2>
        <ul className="flex flex-wrap gap-2">
          {state.participants.map((p) => (
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

  // Remote elves get Santa's broadcast next to their own panel (stacked picture-in-picture on phones).
  return (
    <main className="min-h-dvh bg-cream lg:grid lg:grid-cols-[1.6fr_1fr]">
      <div className="sticky top-0 z-20 bg-wall p-2 lg:h-dvh lg:p-4">
        <div className="relative aspect-video overflow-hidden rounded-felt lg:aspect-auto lg:h-full">
          <CeremonyStage state={state} locale={locale} audible={sound.enabled} serverToLocal={serverToLocal} compact className="h-full w-full" />
          {!sound.enabled && <SoundGateOverlay onEnable={sound.enable} compact />}
          {sound.enabled && (
            <div className="absolute right-4 top-14 z-30">
              <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />
            </div>
          )}
        </div>
      </div>
      <div className="felt-texture pb-10 lg:h-dvh lg:overflow-y-auto">
        {band}
        <div className="px-5 pt-6">{panel}</div>
      </div>
    </main>
  );
}
