"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { StringLights } from "./landing/Atmosphere";
import { ModePicture } from "./landing/ModesScene";
import { Link, useRouter } from "@/i18n/navigation";
import { quickStartAction } from "@/lib/actions";

const kinds = [
  { kind: "together", picture: "sync" },
  { kind: "remote", picture: "hybrid" },
  { kind: "ownTime", picture: "async" },
] as const;

/** The only question before the workshop opens: how are you celebrating? */
export function QuickStart() {
  const t = useTranslations("create.quick");
  const th = useTranslations("home.modes");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (kind: (typeof kinds)[number]["kind"]) => {
    setChosen(kind);
    setError(null);
    start(async () => {
      const result = await quickStartAction({ kind, locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (result.ok) router.push(`/s/${result.code}/host`);
      else {
        setChosen(null);
        setError(te.has(result.error) ? te(result.error) : te("unknown"));
      }
    });
  };

  return (
    <div className="relative">
      <StringLights swags={5} perSwag={6} sag={26} className="opacity-90" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 md:pt-28">
        <h1 className="foil font-display text-4xl font-black leading-[1.02] tracking-[-0.025em] md:text-6xl">{t("heading")}</h1>
        <p className="mt-4 max-w-xl text-lg text-snow/85">{t("lead")}</p>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {kinds.map(({ kind, picture }, i) => {
            const busy = pending && chosen === kind;
            return (
              <motion.li
                key={kind}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: chosen && chosen !== kind ? 0.45 : 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: chosen ? 0 : 0.08 * i }}
              >
                <button
                  onClick={() => pick(kind)}
                  disabled={pending}
                  aria-busy={busy}
                  className="group block w-full text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait"
                >
                  <span className="gilt relative block aspect-[4/3] overflow-hidden rounded-felt transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-0.6deg]">
                    <ModePicture mode={picture} />
                    {busy && (
                      <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-2xl font-bold text-snow">
                        <span className="animate-pulse">{t("starting")}</span>
                      </span>
                    )}
                  </span>
                  <span className="mt-4 block font-display text-2xl font-bold text-snow group-hover:text-gold">{th(`${picture}.title`)}</span>
                  <span className="mt-1 block text-snow/75">{t(`${kind}.body`)}</span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {error && (
          <p role="alert" className="mt-6 rounded-2xl bg-berry/30 px-4 py-3 text-snow">
            {error}
          </p>
        )}

        <p className="mt-12 text-snow/70">
          {t("plan")}{" "}
          <Link href="/new/plan" className="font-semibold text-snow underline decoration-gold/60 underline-offset-4 hover:text-gold">
            {t("planLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
