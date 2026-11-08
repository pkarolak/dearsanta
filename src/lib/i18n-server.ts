import { createTranslator } from "next-intl";
import { isLocale, routing, type Locale } from "@/i18n/routing";
import pl from "../../messages/pl.json";
import en from "../../messages/en.json";
import de from "../../messages/de.json";
import es from "../../messages/es.json";
import pt from "../../messages/pt.json";

export const allMessages = { pl, en, de, es, pt } satisfies Record<Locale, unknown>;

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : routing.defaultLocale;
}

/** Translator usable outside React rendering (e-mails, ceremony scripts). */
export function translatorFor<N extends keyof typeof en>(locale: string, namespace: N) {
  const l = toLocale(locale);
  return createTranslator({ locale: l, messages: allMessages[l] as typeof en, namespace });
}

export function formatWhen(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone }).format(date);
}

export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
