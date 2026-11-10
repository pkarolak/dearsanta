"use client";

import { CheckCircle, DeviceMobile, Television } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Snowfall, StringLights } from "./landing/Atmosphere";
import { PhoneLinkQr } from "./PhoneHandoff";
import type { SessionState } from "@/lib/state";

const key = (code: string) => `sh_devices_${code}`;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};

/** Whether this browser already finished pairing the Elf Chief's devices; null until it can tell. */
export function useDevicesReady(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key(code)) === "1",
    () => null,
  );
}

export function markDevicesReady(code: string) {
  localStorage.setItem(key(code), "1");
  listeners.forEach((fn) => fn());
}

/**
 * The start of a party draw: the ceremony plays on a big screen everyone can see, while the Elf Chief
 * runs it from their phone, the only place their own match shows up. This pairs the two.
 */
export function DeviceSetup({ state, screenUrl }: { state: SessionState; screenUrl: string }) {
  const t = useTranslations("host.devices");
  const s = state.session;
  const [here, setHere] = useState<"screen" | "phone" | null>(null);
  const tvUrl = `${screenUrl.replace(/^https?:\/\//, "").split("/")[0]}/tv`;
  const phoneJoined = here === "screen" && !!s.remotePaired;

  useEffect(() => {
    if (!phoneJoined) return;
    const go = setTimeout(() => {
      markDevicesReady(s.code);
      window.location.assign(screenUrl);
    }, 2500);
    return () => clearTimeout(go);
  }, [phoneJoined, s.code, screenUrl]);

  return (
    <section className="relative overflow-hidden rounded-felt bg-[linear-gradient(180deg,#141d40,#0d1a42_60%,#1c0c0b)] px-5 pb-8 pt-12 text-snow md:px-10 md:pb-10">
      <StringLights swags={4} perSwag={6} sag={22} className="opacity-90" />
      <Snowfall count={18} />
      <div className="relative mx-auto max-w-3xl">
        <h2 className="glow-text text-center font-display text-3xl font-black sm:text-4xl leading-[1.05] md:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-snow/85 md:text-lg">{t("lead")}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-8">
          <Device icon={<Television weight="duotone" className="h-8 w-8" />} title={t("screenTitle")} body={t("screenBody")} done={!!s.screenConnected} t={t} />
          <Device icon={<DeviceMobile weight="duotone" className="h-8 w-8" />} title={t("phoneTitle")} body={t("phoneBody")} done={!!s.remotePaired} t={t} />
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-snow/10 p-4 md:mt-8 md:p-6">
          <p className="text-center font-semibold text-snow/80">{t("where")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-ink/40 p-1" role="radiogroup" aria-label={t("where")}>
            {(["screen", "phone"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={here === d}
                onClick={() => setHere(d)}
                className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors md:text-base ${
                  here === d ? "bg-snow text-ink" : "text-snow/80 hover:bg-snow/10"
                }`}
              >
                {d === "screen" ? <Television weight="bold" className="h-5 w-5 shrink-0" /> : <DeviceMobile weight="bold" className="h-5 w-5 shrink-0" />}
                {d === "screen" ? t("hereScreen") : t("herePhone")}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {here && (
              <motion.div
                key={here}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-6 text-center"
              >
                {here === "screen" ? (
                  phoneJoined ? (
                    <Done text={t("phoneDone")}>
                      <a href={screenUrl} onClick={() => markDevicesReady(s.code)} className="btn-primary">
                        {t("openStage")}
                      </a>
                    </Done>
                  ) : (
                    <>
                      <p className="font-display text-2xl font-bold">{t("scanTitle")}</p>
                      <p className="mx-auto mt-1 max-w-md text-snow/75">{t("scanBody")}</p>
                      <div className="mt-5 text-ink">
                        <PhoneLinkQr code={s.code} size={176} />
                      </div>
                    </>
                  )
                ) : s.screenConnected ? (
                  <Done text={t("tvDone")}>
                    <button type="button" className="btn-primary" onClick={() => markDevicesReady(s.code)}>
                      {t("toRemote")}
                    </button>
                  </Done>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold">{t("tvTitle")}</p>
                    <p className="mx-auto mt-1 max-w-md text-snow/75">
                      {t.rich("tvBody", { url: tvUrl, b: (chunks) => <strong className="text-snow">{chunks}</strong> })}
                    </p>
                    <p className="mt-4 whitespace-nowrap font-display text-5xl font-black tracking-[0.12em] text-gold sm:text-6xl" data-testid="screen-code">
                      {s.screenCode?.replace(/(\d{3})(\d{3})/, "$1 $2")}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-5 text-center">
          <button type="button" className="text-sm font-semibold text-snow/60 underline-offset-2 hover:text-snow hover:underline" onClick={() => markDevicesReady(s.code)}>
            {t("skip")}
          </button>
        </p>
      </div>
    </section>
  );
}

function Device({ icon, title, body, done, t }: { icon: ReactNode; title: string; body: string; done: boolean; t: (k: string) => string }) {
  return (
    <div className={`rounded-[1.5rem] p-4 ring-1 md:p-5 transition-colors ${done ? "bg-pine/30 ring-pine/60" : "bg-snow/[0.06] ring-snow/15"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-gold">{icon}</span>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-pine text-snow" : "bg-snow/10 text-snow/60"}`}>
          {done && <CheckCircle weight="fill" className="h-4 w-4" />}
          {done ? t("connected") : t("notYet")}
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-bold md:mt-3 md:text-2xl">{title}</p>
      <p className="mt-1 text-sm text-snow/75">{body}</p>
    </div>
  );
}

function Done({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CheckCircle weight="fill" className="h-14 w-14 text-gold" />
      <p className="font-display text-2xl font-bold">{text}</p>
      {children}
    </div>
  );
}
