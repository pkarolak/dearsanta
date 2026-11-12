"use client";

import { DeviceMobile, Devices, Television } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { StringLights } from "./landing/Atmosphere";
import { ModePicture } from "./landing/ModesScene";
import { useQuickStart } from "./useQuickStart";
import { Link } from "@/i18n/navigation";

const kinds = [
  { kind: "together", picture: "sync", needs: [Television, DeviceMobile] },
  { kind: "remote", picture: "hybrid", needs: [Devices] },
  { kind: "ownTime", picture: "async", needs: [DeviceMobile] },
] as const;

/** The only question before the workshop opens: how are you celebrating? */
export function QuickStart() {
  const t = useTranslations("create.quick");
  const th = useTranslations("home.modes");
  const { pick, pending, chosen, error } = useQuickStart();

  return (
    <div className="relative">
      <StringLights swags={5} perSwag={6} sag={26} className="opacity-90" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 md:pt-28">
        <h1 className="foil font-display text-4xl font-black leading-[1.02] tracking-[-0.025em] md:text-6xl">{t("heading")}</h1>
        <p className="mt-4 max-w-xl text-lg text-snow/85">{t("lead")}</p>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {kinds.map(({ kind, picture, needs }, i) => {
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
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-snow/10 px-3 py-1.5 text-sm font-semibold text-snow/90 ring-1 ring-snow/15">
                    {needs.map((Icon, n) => (
                      <Icon key={n} weight="bold" className="h-4 w-4 text-gold" />
                    ))}
                    {t(`${kind}.needs`)}
                  </span>
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
