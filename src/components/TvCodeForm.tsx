"use client";

import { Television } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Snowfall, StringLights } from "./landing/Atmosphere";
import { useRouter } from "@/i18n/navigation";
import { openScreenAction } from "@/lib/actions";

export function TvCodeForm() {
  const t = useTranslations("tv");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const digits = value.replace(/\D/g, "").slice(0, 6);

  return (
    <>
      <StringLights swags={5} perSwag={6} sag={26} className="opacity-90" />
      <Snowfall count={36} />
      <form
        className="relative mx-auto flex max-w-xl flex-col items-center px-6 pt-[12svh] text-center"
        action={() =>
          start(async () => {
            const res = await openScreenAction(digits);
            if (res.ok) router.push(res.path);
            else setError(true);
          })
        }
      >
        <Television weight="duotone" className="h-20 w-20 text-gold" />
        <h1 className="foil mt-4 font-display text-5xl font-black md:text-7xl">{t("title")}</h1>
        <p className="mt-4 text-xl text-snow/85">{t("lead")}</p>
        <label htmlFor="tv-code" className="sr-only">
          {t("label")}
        </label>
        <input
          id="tv-code"
          value={digits.replace(/(\d{3})(\d)/, "$1 $2")}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="000 000"
          aria-invalid={error}
          className="mt-8 w-full max-w-sm rounded-[1.5rem] bg-paper px-6 py-5 text-center font-display text-6xl font-black tracking-[0.12em] text-ink outline-none ring-4 ring-transparent placeholder:text-ink/20 focus:ring-gold"
        />
        {error && <p className="mt-3 text-lg font-semibold text-gold">{t("notFound")}</p>}
        <button className="btn-primary mt-6 px-10 py-4 text-xl" disabled={pending || digits.length < 6}>
          {t("open")}
        </button>
      </form>
    </>
  );
}
