"use client";

import { CaretDown, Globe } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { OptionBadge, Select } from "./Select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

export const localeOptions = locales.map((l) => ({
  value: l,
  label: localeNames[l],
  leading: (selected: boolean) => <OptionBadge active={selected}>{l.toUpperCase()}</OptionBadge>,
}));

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const dark = tone === "dark";

  return (
    <Select
      options={localeOptions}
      value={locale}
      onChange={(l) => startTransition(() => router.replace(pathname + window.location.search, { locale: l as Locale }))}
      disabled={pending}
      aria-label={`Language: ${localeNames[locale]}`}
      align="end"
      minWidth={208}
      beak
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pl-3 pr-2.5 text-sm font-semibold transition-colors disabled:opacity-60 aria-expanded:bg-current/10 ${
        dark ? "hover:bg-snow/10" : "ring-1 ring-current/20 hover:ring-current/40"
      }`}
      renderTrigger={(selected, open) => (
        <>
          <Globe weight="bold" className="h-4 w-4 opacity-80" aria-hidden />
          {selected?.label}
          <CaretDown weight="bold" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </>
      )}
    />
  );
}
