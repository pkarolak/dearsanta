"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">Language</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => {
            router.replace(pathname + window.location.search, { locale: e.target.value as Locale });
          })
        }
        className="cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pl-3 pr-7 text-sm font-semibold outline-none ring-1 ring-current/20 hover:ring-current/40"
      >
        {locales.map((l) => (
          <option key={l} value={l} className="text-ink">
            {localeNames[l]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-xs" aria-hidden>
        ▾
      </span>
    </label>
  );
}
