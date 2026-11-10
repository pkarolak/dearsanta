"use client";

import { ArrowRight, ArrowsClockwise, CaretDown, ArrowsLeftRight, Clock, Copy, DoorOpen, GearSix, Television, Trash, UsersThree } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { currencies, currencyOptions, parseEmails } from "./CreateSessionForm";
import { localeOptions } from "./LanguageSwitcher";
import { Select } from "./Select";
import { DeviceSetup, markDevicesReady, useDevicesReady } from "./DeviceSetup";
import { Disclosure } from "./Disclosure";
import { RevealCard } from "./RevealCard";
import { PageBand } from "./PageBand";
import { WaitingRoom } from "./WaitingRoom";
import { RemoteIcon } from "./icons";
import { PhoneHandoff } from "./PhoneHandoff";
import { Link } from "@/i18n/navigation";
import {
  addExclusionAction,
  advanceCeremonyAction,
  approveParticipantAction,
  deleteExclusionAction,
  updateExclusionAction,
  inviteAction,
  markRevealedAction,
  removeParticipantAction,
  resendInviteAction,
  setRemoteAction,
  unlockDrawAction,
  updateSettingsAction,
  type ActionResult,
} from "@/lib/actions";
import { ceremonySteps, nextStep } from "@/lib/ceremony/steps";
import type { PublicParticipant, SessionState } from "@/lib/state";
import { useSessionState } from "@/lib/useSessionState";

type Props = { code: string; initial: SessionState; joinUrl: string; screenUrl: string };

export function HostPanel({ code, initial, joinUrl, screenUrl }: Props) {
  const locale = useLocale();
  const t = useTranslations("host");
  const te = useTranslations("errors");
  const { state, refresh } = useSessionState(code, locale, { initial });
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const devicesReady = useDevicesReady(code);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("remote")) return;
    markDevicesReady(code);
    url.searchParams.delete("remote");
    window.history.replaceState(null, "", url);
  }, [code]);

  if (!state) return null;
  const s = state.session;
  const locked = s.drawn;

  const act = (fn: () => Promise<ActionResult>, okText?: string) =>
    start(async () => {
      setMessage(null);
      const result = await fn();
      if (!result.ok) {
        const base = te.has(result.error) ? te(result.error) : te("unknown");
        setMessage({ kind: "error", text: result.detail?.length ? `${base} ${result.detail.join(", ")}` : base });
      } else if (okText) setMessage({ kind: "ok", text: okText });
      await refresh();
    });

  const waiting = state.participants.filter((p) => p.status === "pending" || p.status === "invited");
  const approved = state.participants.filter((p) => p.status === "approved");
  const ready = approved.filter((p) => p.profileComplete).length;
  const upcoming = nextStep(s.step);

  const stepAt = ceremonySteps.indexOf(s.step);
  const rules = state.exclusions ?? [];
  const budget = s.budgetAmount ? new Intl.NumberFormat(locale, { style: "currency", currency: s.currency, maximumFractionDigits: 0 }).format(s.budgetAmount) : null;
  const when = s.scheduledAt ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(s.scheduledAt)) : null;
  const blocked = state.feasibility && !locked && !state.feasibility.ok;
  const inLobby = s.step === "lobby" && !s.drawn;
  const pairing = s.mode === "sync" && inLobby && !(s.screenConnected && s.remotePaired);

  return (
    <main className="felt-texture min-h-dvh pb-20">
      <PageBand
        title={s.title}
        lead={
          <>
            {t("code")} <span className="font-display font-bold tracking-[0.18em] text-snow">{s.code}</span> · {t(`mode.${s.mode}`)}
          </>
        }
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link href={`/s/${code}/me`} className="btn-soft px-4 py-2 text-sm">{t("myElf")}</Link>
          {!(s.step === "lobby" && !s.drawn) && <PhoneHandoff code={code} className="btn-soft px-4 py-2 text-sm max-sm:hidden" />}
          {s.mode === "sync" && !(s.step === "lobby" && !s.drawn) && (
            <a href={screenUrl} target="_blank" rel="noreferrer" className="btn-pine px-4 py-2 text-sm">
              <Television weight="bold" className="h-4 w-4" />
              {t("openScreen")}
            </a>
          )}
        </div>
      </PageBand>
      {pairing && devicesReady === null ? null : pairing && !devicesReady ? (
        <div className="mx-auto max-w-6xl px-5 py-6">
          <DeviceSetup state={state} screenUrl={screenUrl} />
        </div>
      ) : (
        <>
      {inLobby && (
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <WaitingRoom state={state} joinUrl={joinUrl} screenUrl={screenUrl} onChanged={refresh} />
        </div>
      )}
      <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        {s.mode === "sync" && state.assignment && (
          <RevealCard
            receiver={state.assignment.receiver}
            budget={budget}
            initiallyRevealed={state.assignment.revealed}
            onReveal={() => void markRevealedAction(code)}
          />
        )}

        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`rounded-2xl px-4 py-3 ${message.kind === "error" ? "bg-berry/10 text-berry" : "bg-pine/10 text-pine"}`}
          >
            {message.text}
          </p>
        )}

        {waiting.length > 0 && (
          <section className="card border-2 border-gold/60 p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <DoorOpen weight="bold" className="h-5 w-5 text-berry" />
              {t("atTheDoor")} <span className="text-muted">({waiting.length})</span>
            </h2>
            <ul className="mt-3 space-y-2">
              {waiting.map((p) => (
                <PersonRow key={p.id} p={p}>
                  {p.status === "invited" && (
                    <button className="btn-ghost px-3 py-1.5 text-xs" disabled={pending} onClick={() => act(() => resendInviteAction(code, p.id), t("resent"))}>
                      {t("resend")}
                    </button>
                  )}
                  <button className="btn-pine px-3 py-1.5 text-xs" disabled={pending || locked} onClick={() => act(() => approveParticipantAction(code, p.id, true))}>
                    {t("letIn")}
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-xs" disabled={pending || locked} onClick={() => act(() => approveParticipantAction(code, p.id, false))}>
                    {t("reject")}
                  </button>
                </PersonRow>
              ))}
            </ul>
          </section>
        )}

        {/* The one thing to do next */}
        <section className="card p-5 md:p-6">
          {s.mode === "sync" ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-bold">{t(`steps.${s.step}`)}</h2>
                <p className="shrink-0 text-sm font-semibold text-muted">{t("stepOf", { n: stepAt + 1, total: ceremonySteps.length })}</p>
              </div>
              <div className="mt-3 flex gap-1" aria-hidden>
                {ceremonySteps.map((step, i) => (
                  <span key={step} className={`h-1.5 flex-1 rounded-full ${i < stepAt ? "bg-pine" : i === stepAt ? "bg-berry" : "bg-ink/10"}`} />
                ))}
              </div>
              <p className="mt-4 text-muted">{t(`stepHint.${s.step}`)}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {upcoming && (
                  <button className="btn-primary" disabled={pending || (s.step === "lobby" && !!blocked)} onClick={() => act(() => advanceCeremonyAction(code))}>
                    {s.step === "lobby" ? t("start") : t("next", { step: t(`steps.${upcoming}`) })}
                  </button>
                )}
                {s.step !== "lobby" && (
                  <button className="text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline" disabled={pending} onClick={() => act(() => advanceCeremonyAction(code, s.step))}>
                    {t("replay")}
                  </button>
                )}
              </div>
              {state.revealProgress && s.drawn && (
                <p className="mt-4 text-sm font-semibold text-pine">
                  {t("revealProgress", { revealed: state.revealProgress.revealed, total: state.revealProgress.total })}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold">{t("asyncTitle")}</h2>
              <p className="mt-2 text-muted">{t("asyncReady", { ready, total: approved.length })}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${approved.length ? (ready / approved.length) * 100 : 0}%` }} />
              </div>
              {!s.drawn ? (
                <button
                  className="btn-primary mt-5"
                  disabled={pending || !!blocked}
                  onClick={() => {
                    if (ready < approved.length && !window.confirm(t("unlockConfirm"))) return;
                    act(() => unlockDrawAction(code), t("unlocked"));
                  }}
                >
                  {t("unlock")}
                </button>
              ) : (
                <p className="mt-5 font-semibold text-pine">
                  {t("unlockedProgress", { revealed: state.revealProgress?.revealed ?? 0, total: state.revealProgress?.total ?? 0 })}
                </p>
              )}
            </>
          )}

          {blocked && (
            <p className="mt-4 rounded-2xl bg-gold/15 px-4 py-3 text-sm text-ink">
              {state.feasibility!.tooFew ? t("feasibility.tooFew") : t("feasibility.blocked", { names: state.feasibility!.blockedNames.join(", ") })}
            </p>
          )}
        </section>

        {/* Everything else, folded away */}
        <div className="card overflow-hidden p-0">
          <Disclosure
            title={t("elvesLabel")}
            icon={<UsersThree weight="bold" className="h-5 w-5" />}
            summary={t("elvesSummary", { count: approved.length, ready })}
          >
            <ul className="space-y-2">
              {approved.map((p) => (
                <PersonRow key={p.id} p={p}>
                  {s.mode === "sync" && (
                    <button
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${p.isRemote ? "bg-gold/25 text-ink" : "well text-muted"}`}
                      disabled={pending}
                      onClick={() => act(() => setRemoteAction(code, p.id, !p.isRemote))}
                      title={t("remoteHint")}
                    >
                      <RemoteIcon className="h-3.5 w-3.5" />
                      {p.isRemote ? t("remote") : t("inRoom")}
                    </button>
                  )}
                  {p.role !== "host" && !locked && (
                    <button
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-berry"
                      disabled={pending}
                      aria-label={t("remove")}
                      title={t("remove")}
                      onClick={() => window.confirm(t("removeConfirm", { name: p.displayName })) && act(() => removeParticipantAction(code, p.id))}
                    >
                      <Trash weight="bold" className="h-4 w-4" />
                    </button>
                  )}
                </PersonRow>
              ))}
            </ul>
            {!(s.step === "lobby" && !s.drawn) && (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-paper p-4">
                <QRCodeSVG value={joinUrl} size={96} bgColor="transparent" fgColor="#3B2A22" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{t("shareLink")}</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted">{joinUrl}</p>
                  <button className="btn-soft mt-2 px-3 py-1.5 text-xs" onClick={() => navigator.clipboard?.writeText(joinUrl)}>
                    <Copy weight="bold" className="h-3.5 w-3.5" />
                    {t("copy")}
                  </button>
                </div>
              </div>
            )}
            {!locked && <InviteBox pending={pending} onInvite={(emails) => act(() => inviteAction(code, emails), t("invitesSent"))} />}
          </Disclosure>

          <Disclosure
            title={t("exclusions")}
            icon={<ArrowsLeftRight weight="bold" className="h-5 w-5" />}
            summary={rules.length ? t("pairsSummary", { count: rules.length }) : t("pairsNone")}
          >
            <ExclusionsBox
              state={state}
              disabled={pending || locked}
              onAdd={(g, r, both) => act(() => addExclusionAction(code, g, r, both))}
              onUpdate={(id, g, r, both) => act(() => updateExclusionAction(code, id, g, r, both))}
              onDelete={(id) => act(() => deleteExclusionAction(code, id))}
            />
          </Disclosure>

          <Disclosure
            title={t("settings")}
            icon={<GearSix weight="bold" className="h-5 w-5" />}
            summary={[when ?? t("noDate"), budget ? t("budgetSummary", { amount: budget }) : t("noBudget")].join(" · ")}
          >
            <SettingsBox state={state} disabled={pending} onSave={(patch) => act(() => updateSettingsAction(code, patch), t("settingsSaved"))} />
            {s.commitment && (
              <p className="mt-5 break-all text-xs text-muted">
                {t("fingerprint")} <span className="font-mono">{s.commitment.slice(0, 16)}…</span>
              </p>
            )}
          </Disclosure>
        </div>
      </div>
        </>
      )}
    </main>
  );
}

function PersonRow({ p, children }: { p: PublicParticipant; children?: React.ReactNode }) {
  const t = useTranslations("host");
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream/70 px-3 py-2.5">
      <div className="relative h-11 w-11 shrink-0">
        <Avatar config={p.avatar} className="h-full w-full" />
        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-cream ${p.online ? "bg-pine" : "bg-ink/20"}`} title={p.online ? t("online") : t("offline")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {p.displayName}
          {p.role === "host" && <span className="ml-2 rounded-full bg-berry px-2 py-0.5 text-[10px] font-bold uppercase text-white">{t("chief")}</span>}
        </p>
        <p className="truncate text-xs text-muted">
          {p.email ? `${p.email} · ` : ""}
          {p.status === "approved" ? (p.profileComplete ? t("profileReady") : t("profileMissing")) : t(`participantStatus.${p.status}`)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </li>
  );
}

function InviteBox({ onInvite, pending }: { onInvite: (emails: string[]) => void; pending: boolean }) {
  const t = useTranslations("host");
  const [text, setText] = useState("");
  const emails = parseEmails(text);
  return (
    <div className="mt-6 border-t border-ink/10 pt-5">
      <label className="label" htmlFor="invite">{t("inviteLabel")}</label>
      <textarea id="invite" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="ola@example.com, tom@example.com" className="field" />
      <button
        className="btn-pine mt-3 px-4 py-2 text-sm"
        disabled={pending || emails.length === 0}
        onClick={() => {
          onInvite(emails);
          setText("");
        }}
      >
        {t("inviteSend", { count: emails.length })}
      </button>
    </div>
  );
}

function ExclusionsBox({
  state,
  disabled,
  onAdd,
  onUpdate,
  onDelete,
}: {
  state: SessionState;
  disabled: boolean;
  onAdd: (giver: string, receiver: string, both: boolean) => void;
  onUpdate: (id: string, giver: string, receiver: string, both: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("host");
  const people = state.participants.filter((p) => p.status !== "rejected");
  const rules = state.exclusions ?? [];
  const [first, setFirst] = useState<string | null>(null);
  const [nudged, setNudged] = useState<string | null>(null);
  const person = (id: string) => people.find((p) => p.id === id);
  const name = (id: string) => person(id)?.displayName ?? "?";

  const pick = (id: string) => {
    if (!first) return setFirst(id);
    if (first === id) return setFirst(null);
    const existing = rules.find((r) => (r.giverId === first && r.receiverId === id) || (r.giverId === id && r.receiverId === first));
    setFirst(null);
    if (existing) {
      setNudged(existing.id);
      setTimeout(() => setNudged(null), 1600);
      return;
    }
    onAdd(first, id, true);
  };

  return (
    <div>
      <p className="text-sm text-muted">{t("exclusionsHint")}</p>

      <p className="mt-5 flex min-h-6 items-center gap-2 text-sm font-semibold" aria-live="polite">
        {first ? (
          <>
            <span className="text-berry">{t("pickSecond", { name: name(first) })}</span>
            <button className="text-muted underline underline-offset-2 hover:text-ink" onClick={() => setFirst(null)}>
              {t("cancel")}
            </button>
          </>
        ) : (
          <span className="text-muted">{t("pickFirst")}</span>
        )}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {people.map((p) => {
          const active = first === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => pick(p.id)}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                  active ? "bg-berry text-snow shadow-[0_6px_16px_-6px_rgb(184_32_44/0.7)] ring-2 ring-berry ring-offset-2 ring-offset-cream" : "bg-paper hover:bg-snow hover:shadow-sm"
                }`}
              >
                <Avatar config={p.avatar} title="" className="h-8 w-8" />
                {p.displayName}
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="mt-5 space-y-2">
        {rules.length === 0 && <li className="rounded-2xl border-2 border-dashed border-ink/10 px-4 py-3 text-sm text-muted">{t("noExclusions")}</li>}
        {rules.map((ex) => {
          const giver = person(ex.giverId);
          const receiver = person(ex.receiverId);
          return (
            <li
              key={ex.id}
              className={`rounded-2xl bg-paper px-4 py-3 transition-shadow ${nudged === ex.id ? "ring-2 ring-gold" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center">
                  {giver && <Avatar config={giver.avatar} title={giver.displayName} className="h-9 w-9 ring-2 ring-paper" />}
                  <span className="z-10 -mx-1.5 grid h-7 w-7 place-items-center rounded-full bg-cream text-muted ring-2 ring-paper">
                    {ex.bidirectional ? <ArrowsLeftRight weight="bold" className="h-4 w-4" /> : <ArrowRight weight="bold" className="h-4 w-4" />}
                  </span>
                  {receiver && <Avatar config={receiver.avatar} title={receiver.displayName} className="h-9 w-9 ring-2 ring-paper" />}
                </div>
                <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                  {ex.bidirectional
                    ? t("ruleBoth", { a: name(ex.giverId), b: name(ex.receiverId) })
                    : t("ruleOneWay", { giver: name(ex.giverId), receiver: name(ex.receiverId) })}
                </p>
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-berry"
                  disabled={disabled}
                  onClick={() => onDelete(ex.id)}
                  aria-label={t("remove")}
                  title={t("remove")}
                >
                  <Trash weight="bold" className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-[5.6rem] max-sm:pl-0">
                <div className="flex rounded-full bg-cream p-0.5 text-xs font-semibold" role="group">
                  {[true, false].map((both) => (
                    <button
                      key={String(both)}
                      type="button"
                      disabled={disabled}
                      aria-pressed={ex.bidirectional === both}
                      onClick={() => ex.bidirectional !== both && onUpdate(ex.id, ex.giverId, ex.receiverId, both)}
                      className={`rounded-full px-3 py-1 transition-colors ${ex.bidirectional === both ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                    >
                      {both ? t("mutual") : t("oneWay")}
                    </button>
                  ))}
                </div>
                {!ex.bidirectional && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdate(ex.id, ex.receiverId, ex.giverId, false)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted hover:bg-cream hover:text-ink"
                  >
                    <ArrowsClockwise weight="bold" className="h-3.5 w-3.5" />
                    {t("flip")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toLocalInputs(iso: string | null) {
  if (!iso) return { date: "", time: "18:00" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

function SettingsBox({
  state,
  disabled,
  onSave,
}: {
  state: SessionState;
  disabled: boolean;
  onSave: (patch: Parameters<typeof updateSettingsAction>[1]) => void;
}) {
  const t = useTranslations("host");
  const tc = useTranslations("create");
  const s = state.session;
  const when = toLocalInputs(s.scheduledAt);
  const [more, setMore] = useState(false);

  return (
    <>
      <form
        key={[s.title, s.scheduledAt, s.location, s.onlineUrl, s.budgetAmount, s.currency, s.locale, s.mode, s.drawn].join("|")}
        className="space-y-4"
        action={(form) => {
          const date = String(form.get("date") ?? "");
          const time = String(form.get("time") ?? "") || "18:00";
          const budget = Number(String(form.get("budget") ?? "").replace(",", "."));
          onSave({
            title: String(form.get("title")),
            scheduledAt: date ? new Date(`${date}T${time}`).toISOString() : null,
            location: String(form.get("location") ?? ""),
            onlineUrl: String(form.get("onlineUrl") ?? ""),
            ...(s.drawn ? {} : { budgetAmount: budget > 0 ? budget : null }),
            currency: String(form.get("currency")) as (typeof currencies)[number],
            locale: String(form.get("sessionLocale")),
            ...(s.step === "lobby" && !s.drawn ? { mode: String(form.get("mode")) as "sync" | "async" } : {}),
          });
        }}
      >
        <div>
          <label className="label" htmlFor="s-title">{tc("title")}</label>
          <input id="s-title" name="title" defaultValue={s.title} required className="field" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-date">{tc("date")}</label>
            <input id="s-date" name="date" type="date" defaultValue={when.date} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="s-time">{tc("time")}</label>
            <input id="s-time" name="time" type="time" defaultValue={when.time} className="field" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label" htmlFor="s-budget">{tc("budget")}</label>
            <input id="s-budget" name="budget" inputMode="decimal" defaultValue={s.budgetAmount ?? ""} disabled={s.drawn} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="s-currency">{tc("currency")}</label>
            <Select id="s-currency" name="currency" defaultValue={s.currency} options={currencyOptions} className="field min-w-36" />
          </div>
        </div>
        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink" aria-expanded={more} onClick={() => setMore((m) => !m)}>
          <CaretDown weight="bold" className={`h-4 w-4 transition-transform ${more ? "rotate-180" : ""}`} />
          {more ? t("fewerSettings") : t("moreSettings")}
        </button>
        <div className={more ? "space-y-4" : "hidden"}>
        <div>
          <label className="label" htmlFor="s-location">{tc("location")}</label>
          <input id="s-location" name="location" defaultValue={s.location ?? ""} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="s-online">{tc("onlineUrl")}</label>
          <input id="s-online" name="onlineUrl" type="url" defaultValue={s.onlineUrl ?? ""} className="field" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-locale">{tc("language")}</label>
            <Select id="s-locale" name="sessionLocale" defaultValue={s.locale} options={localeOptions} />
          </div>
          <div>
            <label className="label" htmlFor="s-mode">{tc("mode")}</label>
            <Select
              id="s-mode"
              name="mode"
              defaultValue={s.mode}
              disabled={s.step !== "lobby" || s.drawn}
              options={[
                { value: "sync", label: tc("modes.sync.title"), leading: <UsersThree weight="bold" className="h-5 w-5 shrink-0 text-pine" /> },
                { value: "async", label: tc("modes.async.title"), leading: <Clock weight="bold" className="h-5 w-5 shrink-0 text-pine" /> },
              ]}
            />
          </div>
        </div>
        </div>
        <button className="btn-primary w-full" disabled={disabled}>
          {t("saveSettings")}
        </button>
      </form>
    </>
  );
}
