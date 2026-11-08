"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Avatar } from "./Avatar";
import { AvatarEditor } from "./AvatarEditor";
import { CeremonyStage } from "./CeremonyStage";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { RevealCard } from "./RevealCard";
import { Santa } from "./Santa";
import { MuteButton, SoundGateOverlay, useSoundGate } from "./SoundControls";
import { Link } from "@/i18n/navigation";
import { markRevealedAction, setRemoteAction } from "@/lib/actions";
import type { SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";

export function ElfRoom({ code, initial }: { code: string; initial: SessionState }) {
  const locale = useLocale();
  const t = useTranslations("elf");
  const { state, serverToLocal, refresh } = useSessionState(code, locale, { initial });
  const sound = useSoundGate();
  const [pending, start] = useTransition();
  if (!state) return null;

  const me = state.viewer!;
  const s = state.session;
  const budget =
    s.budgetAmount !== null
      ? new Intl.NumberFormat(locale, { style: "currency", currency: s.currency, maximumFractionDigits: 2 }).format(s.budgetAmount)
      : null;

  if (me.status !== "approved") {
    return (
      <main className="paper-grain flex min-h-dvh flex-col items-center justify-center px-5 text-center">
        <div className="w-40 animate-float">
          <Santa className="h-auto w-full" />
        </div>
        <h1 className="mt-6 font-display text-3xl">{me.status === "rejected" ? t("rejectedTitle") : t("waitingTitle", { name: me.displayName })}</h1>
        <p className="mt-2 max-w-sm text-muted">{me.status === "rejected" ? t("rejectedBody") : t("waitingBody")}</p>
        <p className="mt-6 text-sm text-muted">{s.title} · {s.code}</p>
      </main>
    );
  }

  const isRemote = me.isRemote && s.mode === "sync";
  const ceremonyRunning = s.mode === "sync" && s.step !== "lobby";
  const toggleRemote = () =>
    start(async () => {
      await setRemoteAction(code, me.id, !me.isRemote);
      await refresh();
    });

  const panel = (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-berry">{s.title}</p>
          <h1 className="font-display text-3xl">{t("hello", { name: me.displayName })}</h1>
        </div>
        <div className="flex items-center gap-2">
          {state.isHost && (
            <Link href={`/s/${code}/host`} className="btn-soft px-4 py-2 text-sm">{t("hostPanel")}</Link>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      {state.assignment && (s.mode === "sync" ? (
        <RevealCard
          receiver={state.assignment.receiver}
          budget={budget}
          initiallyRevealed={state.assignment.revealed}
          onReveal={() => void markRevealedAction(code)}
        />
      ) : (
        <div className="clay p-6 text-center">
          <p className="font-display text-2xl">{t("drawDone")}</p>
          <Link href={`/s/${code}/reveal`} className="btn-primary mt-4">{t("watchReveal")}</Link>
        </div>
      ))}

      {s.mode === "sync" && !state.assignment && (
        <div className="clay-sunk flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm">{isRemote ? t("remoteOn") : ceremonyRunning ? t("watchScreen") : t("inRoom")}</p>
          <button className="btn-soft px-4 py-2 text-sm" onClick={toggleRemote} disabled={pending}>
            {me.isRemote ? t("imHere") : t("notInRoom")}
          </button>
        </div>
      )}

      {s.mode === "async" && !s.drawn && me.profileComplete && (
        <div className="clay-sunk px-5 py-4 text-sm">{t("asyncWaiting")}</div>
      )}

      {!state.assignment && (
        <section>
          <h2 className="mb-3 font-display text-2xl">{me.profileComplete ? t("yourElf") : t("createElf")}</h2>
          <AvatarEditor
            code={code}
            initialName={me.displayName}
            initialAvatar={me.avatar}
            completed={me.profileComplete}
            onSaved={() => void refresh()}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl">{t("team", { count: state.participants.length })}</h2>
        <ul className="flex flex-wrap gap-2">
          {state.participants.map((p) => (
            <li
              key={p.id}
              title={p.profileComplete ? undefined : t("dressing")}
              className={`clay-sunk flex items-center gap-2 py-1 pl-1 pr-3 text-sm ${p.profileComplete ? "" : "opacity-60"}`}
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
    return <main className="paper-grain min-h-dvh px-5 py-8"><div className="mx-auto max-w-2xl">{panel}</div></main>;
  }

  // Remote elves get Santa's broadcast next to their own panel (stacked picture-in-picture on phones).
  return (
    <main className="min-h-dvh bg-cream lg:grid lg:grid-cols-[1.35fr_1fr]">
      <div className="sticky top-0 z-20 h-[44dvh] p-2 lg:h-dvh lg:p-4">
        <div className="relative h-full overflow-hidden rounded-[1.75rem]">
          <CeremonyStage state={state} locale={locale} audible={sound.enabled} serverToLocal={serverToLocal} compact />
          {!sound.enabled && <SoundGateOverlay onEnable={sound.enable} compact />}
          {sound.enabled && (
            <div className="absolute right-4 top-14 z-30">
              <MuteButton muted={sound.muted} onToggle={sound.toggleMute} />
            </div>
          )}
        </div>
      </div>
      <div className="paper-grain px-5 py-6 lg:h-dvh lg:overflow-y-auto">{panel}</div>
    </main>
  );
}
