"use client";

import { Check, PencilSimple, ShareNetwork, Television } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { Snowfall, StringLights } from "./landing/Atmosphere";
import { PhoneHandoff } from "./PhoneHandoff";
import { Link } from "@/i18n/navigation";
import { saveProfileAction, updateSettingsAction } from "@/lib/actions";
import type { SessionState } from "@/lib/state";

type Props = { state: SessionState; joinUrl: string; screenUrl: string; children?: React.ReactNode };

/**
 * Where a spontaneous Secret Santa begins: the code to scan, and every elf popping in as they join,
 * their looks changing live while they dress up on their phones.
 */
export function WaitingRoom({ state, joinUrl, screenUrl, children }: Props) {
  const t = useTranslations("host.room");
  const s = state.session;
  const elves = state.participants.filter((p) => p.status === "approved" && p.plays);
  const [copied, setCopied] = useState(false);
  const shortUrl = joinUrl.replace(/^https?:\/\//, "");
  const tvUrl = `${shortUrl.split("/")[0]}/tv`;
  const onScreen = s.mode === "sync" && !!s.screenConnected;

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: s.title, url: joinUrl }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="@container relative overflow-hidden rounded-felt bg-[linear-gradient(180deg,#141d40,#0d1a42_60%,#1c0c0b)] p-6 text-snow md:p-10">
      <StringLights swags={4} perSwag={6} sag={22} className="opacity-90" />
      <Snowfall count={24} />
      <div className={`relative grid items-center gap-8 pt-6 md:gap-12 ${onScreen ? "" : "@2xl:grid-cols-[auto_1fr]"}`}>
        {!onScreen && (
        <div className="mx-auto flex flex-col items-center">
          <div className="rounded-[1.6rem] bg-paper p-4 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.7),0_0_60px_-10px_rgb(255_200_110/0.35)]">
            <QRCodeSVG value={joinUrl} size={232} bgColor="transparent" fgColor="#2b1810" className="h-[min(232px,62vw)] w-[min(232px,62vw)]" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t("guestCode")}</p>
          <p className="foil mt-1 font-display text-5xl font-black tracking-[0.16em] md:text-6xl" data-testid="room-code">
            {s.code}
          </p>
          <p className="mt-1 text-center text-sm text-snow/65">
            {t.rich("guestHint", { url: shortUrl.replace(/\/join\/.*/, ""), b: (chunks) => <strong className="font-mono font-normal text-snow/85">{chunks}</strong> })}
          </p>
        </div>
        )}

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">{t("hostRole")}</p>
          <h2 className="glow-text mt-1 font-display text-4xl font-black leading-[1.02] md:text-5xl">{t("title")}</h2>
          {onScreen ? (
            <p className="mt-3 max-w-lg text-lg text-snow/85">
              {t.rich("leadRemote", {
                code: s.code,
                b: (chunks) => (
                  <strong className="font-display tracking-[0.14em] text-gold" data-testid="room-code">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
          ) : (
            <p className="mt-3 max-w-lg text-lg text-snow/85">{s.mode === "async" ? t("leadAsync") : t("lead")}</p>
          )}
          <button className="btn-pine mt-5" onClick={share}>
            {copied ? <Check weight="bold" className="h-5 w-5" /> : <ShareNetwork weight="bold" className="h-5 w-5" />}
            {copied ? t("copied") : t("share")}
          </button>

          {s.mode === "sync" && (
            <div className="mt-6 max-w-lg rounded-[1.25rem] bg-snow/10 p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Television weight="bold" className="h-5 w-5 text-gold" />
                {t("screenTitle")}
                {onScreen && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-pine px-2.5 py-0.5 text-xs font-semibold">
                    <Check weight="bold" className="h-3.5 w-3.5" />
                    {t("screenOn")}
                  </span>
                )}
              </p>
              {!onScreen && s.screenCode && (
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <p className="min-w-0 flex-1 basis-60 text-sm text-snow/80">{t.rich("tvHint", { url: tvUrl, b: (chunks) => <strong className="text-snow">{chunks}</strong> })}</p>
                  <p className="text-center">
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-snow/60">{t("screenCode")}</span>
                    <span className="block font-display text-3xl font-black tracking-[0.12em] text-gold" data-testid="screen-code">
                      {s.screenCode.replace(/(\d{3})(\d{3})/, "$1 $2")}
                    </span>
                  </p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={screenUrl} target="_blank" rel="noreferrer" className={onScreen ? "btn-ghost px-4 py-2 text-sm text-snow hover:bg-snow/10" : "btn-primary px-4 py-2 text-sm"}>
                  {t("screen")}
                </a>
                {!s.remotePaired && <PhoneHandoff code={s.code} className="btn-ghost px-4 py-2 text-sm text-snow hover:bg-snow/10 max-sm:hidden" />}
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="font-semibold text-snow/80">{elves.length > 1 ? t("inside", { count: elves.length }) : t("waiting")}</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              <AnimatePresence initial={false}>
                {elves.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.3, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="flex w-20 flex-col items-center text-center"
                  >
                    <Avatar config={p.avatar} title={p.displayName} className="h-16 w-16 ring-2 ring-gold/60" />
                    <span className="mt-1.5 w-full truncate text-sm font-semibold">{p.displayName}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

        </div>
      </div>
      {children && <div className="relative mt-8 rounded-[1.25rem] bg-snow/10 p-5 ring-1 ring-snow/10 md:p-6">{children}</div>}
    </section>
  );
}

/**
 * "You" in the lobby: the Elf Chief's own card. Their name (guests see it in invitations), their elf, and whether
 * they take part in the draw or only run the show.
 */
export function HostElfCard({ state, onChanged }: { state: SessionState; onChanged: () => void }) {
  const me = state.viewer;
  if (!me) return null;
  return <YouCard key={me.displayName} state={state} onChanged={onChanged} />;
}

function YouCard({ state, onChanged }: { state: SessionState; onChanged: () => void }) {
  const t = useTranslations("host.room");
  const locale = useLocale();
  const me = state.viewer!;
  const s = state.session;
  const [pending, start] = useTransition();
  const [name, setName] = useState(me.displayName);
  const changed = name.trim() && name.trim() !== me.displayName;

  const setPlays = (plays: boolean) =>
    plays !== s.hostPlays &&
    start(async () => {
      await updateSettingsAction(s.code, { hostPlays: plays });
      onChanged();
    });

  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar config={me.avatar} title={me.displayName} className={`h-16 w-16 transition ${s.hostPlays ? "" : "opacity-60 grayscale"}`} />
          {s.hostPlays && (
            <Link
              href={`/s/${s.code}/me`}
              aria-label={me.profileComplete ? t("changeElf") : t("myElf")}
              title={me.profileComplete ? t("changeElf") : t("myElf")}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-pine text-snow shadow-md ring-2 ring-cream transition hover:scale-105"
            >
              <PencilSimple weight="bold" className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{me.displayName}</p>
          {me.displayName !== t("chief") && <p className="text-sm font-semibold text-muted">{t("chief")}</p>}
        </div>
      </div>

      <form
        className="mt-5"
        action={() =>
          start(async () => {
            if (!changed) return;
            await saveProfileAction(s.code, { displayName: name.trim(), avatar: me.avatar }, locale);
            onChanged();
          })
        }
      >
        <label className="label" htmlFor="host-name">{t("yourName")}</label>
        <div className="flex gap-2">
          <input id="host-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className="field min-w-0 flex-1" autoComplete="given-name" />
          <button className="btn-soft" disabled={pending || !changed}>
            {t("saveName")}
          </button>
        </div>
      </form>

      <div className="mt-5">
        <p className="label" id="host-plays">{t("roleLabel")}</p>
        <div role="radiogroup" aria-labelledby="host-plays" className="well grid grid-cols-2 gap-1 rounded-full p-1">
          {[true, false].map((plays) => (
            <button
              key={String(plays)}
              type="button"
              role="radio"
              aria-checked={s.hostPlays === plays}
              disabled={pending || s.drawn}
              onClick={() => setPlays(plays)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${s.hostPlays === plays ? "bg-pine text-snow shadow" : "text-muted hover:text-ink"}`}
            >
              {plays ? t("playsYes") : t("playsNo")}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{s.hostPlays ? t("youPlayHint") : t("youDontPlayHint")}</p>
      </div>

      {s.hostPlays && !me.profileComplete && (
        <Link href={`/s/${s.code}/me`} className="btn-pine mt-5 w-full">
          {t("myElf")}
        </Link>
      )}
    </section>
  );
}
