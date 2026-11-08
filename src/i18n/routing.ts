import { defineRouting } from "next-intl/routing";

export const locales = ["pl", "en", "de", "es", "pt"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
});
