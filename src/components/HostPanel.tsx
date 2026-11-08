"use client";

import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { parseEmails, currencies } from "./CreateSessionForm";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { RemoteIcon } from "./icons";
import { Link } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import {
  addExclusionAction,
  advanceCeremonyAction,
  approveParticipantAction,
  deleteExclusionAction,
  inviteAction,
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
  const [showQr, setShowQr] = useState(false);

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

  return (
    <main className="paper-grain min-h-dvh pb-20">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-berry">{t("eyebrow")}</p>
            <h1 className="font-display text-4xl">{s.title}</h1>
            <p className="mt-1 text-muted">
              {t("code")} <span className="font-mono text-lg font-bold tracking-[0.25em] text-ink">{s.code}</span> · {t(`mode.${s.mode}`)} ·{" "}
              {t(`status.${s.status}`)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/s/${code}/me`} className="btn-soft px-4 py-2 text-sm">{t("myElf")}</Link>
            {s.mode === "sync" && (
              <a href={screenUrl} target="_blank" rel="noreferrer" className="btn-pine px-4 py-2 text-sm">
                {t("openScreen")}
              </a>
            )}
            <LanguageSwitcher />
          </div>
        </header>

        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`mt-6 rounded-2xl px-4 py-3 ${message.kind === "error" ? "bg-berry/10 text-berry" : "bg-pine/10 text-pine"}`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            {/* Ceremony / draw controls */}
            <section className="clay p-6">
              {s.mode === "sync" ? (
                <>
                  <h2 className="font-display text-2xl">{t("ceremony")}</h2>
                  <ol className="mt-4 flex flex-wrap gap-2">
                    {ceremonySteps.map((step) => {
                      const i = ceremonySteps.indexOf(step);
                      const current = ceremonySteps.indexOf(s.step);
                      return (
                        <li
                          key={step}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            i === current ? "bg-berry text-white" : i < current ? "bg-pine/15 text-pine" : "clay-sunk text-muted"
                          }`}
                        >
                          {t(`steps.${step}`)}
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-4 text-sm text-muted">{t(`stepHint.${s.step}`)}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {upcoming && (
                      <button className="btn-primary" disabled={pending} onClick={() => act(() => advanceCeremonyAction(code))}>
                        {s.step === "lobby" ? t("start") : t("next", { step: t(`steps.${upcoming}`) })}
                      </button>
                    )}
                    {s.step !== "lobby" && (
                      <button className="btn-soft" disabled={pending} onClick={() => act(() => advanceCeremonyAction(code, s.step))}>
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
                  <h2 className="font-display text-2xl">{t("asyncTitle")}</h2>
                  <p className="mt-2 text-muted">{t("asyncReady", { ready, total: approved.length })}</p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${approved.length ? (ready / approved.length) * 100 : 0}%` }} />
                  </div>
                  {!s.drawn ? (
                    <button
                      className="btn-primary mt-5"
                      disabled={pending}
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

              {state.feasibility && !locked && !state.feasibility.ok && (
                <p className="mt-5 rounded-2xl bg-gold/15 px-4 py-3 text-sm text-ink">
                  {state.feasibility.tooFew ? t("feasibility.tooFew") : t("feasibility.blocked", { names: state.feasibility.blockedNames.join(", ") })}
                </p>
              )}
              {s.commitment && (
                <p className="mt-5 break-all text-xs text-muted">
                  {t("fingerprint")} <span className="font-mono">{s.commitment.slice(0, 16)}…</span>
                </p>
              )}
            </section>

            {/* People */}
            <section className="clay p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl">{t("elves", { count: approved.length })}</h2>
                <button className="btn-soft px-4 py-2 text-sm" onClick={() => setShowQr((v) => !v)}>
                  {showQr ? t("hideQr") : t("showQr")}
                </button>
              </div>
              {showQr && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl bg-cream p-5 sm:flex-row">
                  <QRCodeSVG value={joinUrl} size={140} bgColor="transparent" fgColor="#3B2A22" />
                  <div className="text-sm">
                    <p className="font-semibold">{t("shareLink")}</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted">{joinUrl}</p>
                    <button className="btn-soft mt-3 px-3 py-1.5 text-xs" onClick={() => navigator.clipboard?.writeText(joinUrl)}>
                      {t("copy")}
                    </button>
                  </div>
                </div>
              )}

              {waiting.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("atTheDoor")}</h3>
                  <ul className="mt-2 space-y-2">
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
                </div>
              )}

              <ul className="mt-5 space-y-2">
                {approved.map((p) => (
                  <PersonRow key={p.id} p={p}>
                    {s.mode === "sync" && (
                      <button
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${p.isRemote ? "bg-gold/25 text-ink" : "clay-sunk text-muted"}`}
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
                        className="btn-ghost px-3 py-1.5 text-xs"
                        disabled={pending}
                        onClick={() => window.confirm(t("removeConfirm", { name: p.displayName })) && act(() => removeParticipantAction(code, p.id))}
                      >
                        {t("remove")}
                      </button>
                    )}
                  </PersonRow>
                ))}
              </ul>

              {!locked && <InviteBox pending={pending} onInvite={(emails) => act(() => inviteAction(code, emails), t("invitesSent"))} />}
            </section>
          </div>

          <div className="space-y-6">
            <ExclusionsBox
              state={state}
              disabled={pending || locked}
              onAdd={(g, r, both) => act(() => addExclusionAction(code, g, r, both))}
              onDelete={(id) => act(() => deleteExclusionAction(code, id))}
            />
            <SettingsBox
              state={state}
              disabled={pending}
              onSave={(patch) => act(() => updateSettingsAction(code, patch), t("settingsSaved"))}
            />
          </div>
        </div>
      </div>
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
          {p.email} · {p.status === "approved" ? (p.profileComplete ? t("profileReady") : t("profileMissing")) : t(`participantStatus.${p.status}`)}
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
  onDelete,
}: {
  state: SessionState;
  disabled: boolean;
  onAdd: (giver: string, receiver: string, both: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("host");
  const people = state.participants.filter((p) => p.status !== "rejected");
  const [giver, setGiver] = useState("");
  const [receiver, setReceiver] = useState("");
  const [both, setBoth] = useState(true);
  const name = (id: string) => people.find((p) => p.id === id)?.displayName ?? "?";

  return (
    <section className="clay p-6">
      <h2 className="font-display text-2xl">{t("exclusions")}</h2>
      <p className="mt-1 text-sm text-muted">{t("exclusionsHint")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <select className="field" value={giver} onChange={(e) => setGiver(e.target.value)} disabled={disabled} aria-label={t("giver")}>
          <option value="">{t("giver")}</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.displayName}</option>
          ))}
        </select>
        <span className="self-center text-center text-sm font-semibold text-muted">{both ? "⇄" : "→"}</span>
        <select className="field" value={receiver} onChange={(e) => setReceiver(e.target.value)} disabled={disabled} aria-label={t("receiver")}>
          <option value="">{t("receiver")}</option>
          {people.filter((p) => p.id !== giver).map((p) => (
            <option key={p.id} value={p.id}>{p.displayName}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={both} onChange={(e) => setBoth(e.target.checked)} className="h-4 w-4 accent-berry" />
          {t("bothWays")}
        </label>
        <button
          className="btn-pine px-4 py-2 text-sm"
          disabled={disabled || !giver || !receiver || giver === receiver}
          onClick={() => {
            onAdd(giver, receiver, both);
            setGiver("");
            setReceiver("");
          }}
        >
          {t("addExclusion")}
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {(state.exclusions ?? []).length === 0 && <li className="text-sm text-muted">{t("noExclusions")}</li>}
        {(state.exclusions ?? []).map((ex) => (
          <li key={ex.id} className="flex items-center justify-between rounded-2xl bg-cream/70 px-4 py-2 text-sm">
            <span>
              <strong>{name(ex.giverId)}</strong> {ex.bidirectional ? "⇄" : "→"} <strong>{name(ex.receiverId)}</strong>
            </span>
            <button className="btn-ghost px-2 py-1 text-xs" disabled={disabled} onClick={() => onDelete(ex.id)}>
              {t("remove")}
            </button>
          </li>
        ))}
      </ul>
    </section>
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

  return (
    <section className="clay p-6">
      <h2 className="font-display text-2xl">{t("settings")}</h2>
      <form
        key={[s.title, s.scheduledAt, s.location, s.onlineUrl, s.budgetAmount, s.currency, s.locale, s.mode, s.drawn].join("|")}
        className="mt-4 space-y-4"
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
        <div>
          <label className="label" htmlFor="s-location">{tc("location")}</label>
          <input id="s-location" name="location" defaultValue={s.location ?? ""} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="s-online">{tc("onlineUrl")}</label>
          <input id="s-online" name="onlineUrl" type="url" defaultValue={s.onlineUrl ?? ""} className="field" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label" htmlFor="s-budget">{tc("budget")}</label>
            <input id="s-budget" name="budget" inputMode="decimal" defaultValue={s.budgetAmount ?? ""} disabled={s.drawn} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="s-currency">{tc("currency")}</label>
            <select id="s-currency" name="currency" defaultValue={s.currency} className="field">
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-locale">{tc("language")}</label>
            <select id="s-locale" name="sessionLocale" defaultValue={s.locale} className="field">
              {locales.map((l) => (
                <option key={l} value={l}>{localeNames[l]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-mode">{tc("mode")}</label>
            <select id="s-mode" name="mode" defaultValue={s.mode} disabled={s.step !== "lobby" || s.drawn} className="field">
              <option value="sync">{tc("modes.sync.title")}</option>
              <option value="async">{tc("modes.async.title")}</option>
            </select>
          </div>
        </div>
        <button className="btn-primary w-full" disabled={disabled}>
          {t("saveSettings")}
        </button>
      </form>
    </section>
  );
}
