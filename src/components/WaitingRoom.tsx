"use client";

import { Check, ShareNetwork, Television } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { Snowfall, StringLights } from "./landing/Atmosphere";
import { PhoneHandoff } from "./PhoneHandoff";
import { Link } from "@/i18n/navigation";
import { saveProfileAction } from "@/lib/actions";
import type { SessionState } from "@/lib/state";

type Props = { state: SessionState; joinUrl: string; screenUrl: string; onChanged: () => void };

/**
 * Where a spontaneous Secret Santa begins: the code to scan, and every elf popping in as they join,
 * their looks changing live while they dress up on their phones.
 */
export function WaitingRoom({ state, joinUrl, screenUrl, onChanged }: Props) {
  const t = useTranslations("host.room");
  const locale = useLocale();
  const s = state.session;
  const me = state.viewer;
  const elves = state.participants.filter((p) => p.status === "approved");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const shortUrl = joinUrl.replace(/^https?:\/\//, "");
  const tvUrl = `${shortUrl.split("/")[0]}/tv`;

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
    <section className="relative overflow-hidden rounded-felt bg-[linear-gradient(180deg,#141d40,#0d1a42_60%,#1c0c0b)] p-6 text-snow md:p-10">
      <StringLights swags={4} perSwag={6} sag={22} className="opacity-90" />
      <Snowfall count={24} />
      <div className="relative grid items-center gap-8 pt-6 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="mx-auto flex flex-col items-center">
          <div className="rounded-[1.6rem] bg-paper p-4 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.7),0_0_60px_-10px_rgb(255_200_110/0.35)]">
            <QRCodeSVG value={joinUrl} size={232} bgColor="transparent" fgColor="#2b1810" className="h-[min(232px,62vw)] w-[min(232px,62vw)]" />
          </div>
          <p className="foil mt-5 font-display text-5xl font-black tracking-[0.16em] md:text-6xl" data-testid="room-code">
            {s.code}
          </p>
          <p className="mt-1 font-mono text-sm text-snow/60">{shortUrl.replace(/\/join\/.*/, "")}</p>
        </div>

        <div>
          <h2 className="glow-text font-display text-4xl font-black leading-[1.02] md:text-5xl">{t("title")}</h2>
          <p className="mt-3 max-w-lg text-lg text-snow/85">{s.mode === "async" ? t("leadAsync") : t("lead")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {s.mode === "sync" && (
              <a href={screenUrl} target="_blank" rel="noreferrer" className="btn-primary">
                <Television weight="bold" className="h-5 w-5" />
                {t("screen")}
              </a>
            )}
            <button className="btn-pine" onClick={share}>
              {copied ? <Check weight="bold" className="h-5 w-5" /> : <ShareNetwork weight="bold" className="h-5 w-5" />}
              {copied ? t("copied") : t("share")}
            </button>
            <PhoneHandoff code={s.code} className="btn-ghost text-snow hover:bg-snow/10 max-sm:hidden" />
          </div>
          {s.mode === "sync" && s.screenCode && (
            <div className="mt-4 flex max-w-lg flex-wrap items-center gap-x-4 gap-y-2 rounded-[1.25rem] bg-snow/10 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm text-snow/80">{t.rich("tvHint", { url: tvUrl, b: (chunks) => <strong className="text-snow">{chunks}</strong> })}</p>
              <p className="font-display text-3xl font-black tracking-[0.12em] text-gold" data-testid="screen-code">
                {s.screenCode.replace(/(\d{3})(\d{3})/, "$1 $2")}
              </p>
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

          {me && (
            <div className="mt-7 flex flex-wrap items-end gap-3 rounded-[1.25rem] bg-snow/10 p-4">
              <form
                className="flex min-w-0 flex-1 flex-wrap items-end gap-2"
                action={() =>
                  start(async () => {
                    if (!name.trim()) return;
                    await saveProfileAction(s.code, { displayName: name.trim(), avatar: me.avatar }, locale);
                    setName("");
                    onChanged();
                  })
                }
              >
                <label className="w-full text-sm font-semibold text-snow/80" htmlFor="host-name">
                  {t("yourName")}
                </label>
                <input
                  id="host-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={me.displayName}
                  maxLength={40}
                  className="field min-w-0 flex-1"
                  autoComplete="given-name"
                />
                <button className="btn-soft" disabled={pending || !name.trim()}>
                  {t("saveName")}
                </button>
              </form>
              <Link href={`/s/${s.code}/me`} className="btn-ghost text-snow hover:bg-snow/10">
                {t("myElf")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
