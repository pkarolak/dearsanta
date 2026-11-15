import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { JoinButton } from "./JoinButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SnowflakeIcon } from "./icons";

/**
 * With `cta` this is the landing page's bar: fixed on top for the whole scroll, one frosted strip so it reads
 * the same over the film and every scene after it.
 */
export function SiteHeader({ tone = "light", cta = false }: { tone?: "light" | "dark"; cta?: boolean }) {
  const t = useTranslations("nav");
  const th = useTranslations("home");
  const color = tone === "dark" ? "text-snow" : "text-ink";

  if (cta) {
    return (
      <header className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4 ${color}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full bg-ink/55 py-1.5 pl-4 pr-1.5 shadow-[0_12px_34px_-14px_rgb(0_0_0/0.65)] ring-1 ring-snow/12 backdrop-blur-xl md:pl-5">
          <Link href="/" className="flex h-9 items-center gap-2 whitespace-nowrap font-display text-lg font-bold">
            <SnowflakeIcon className="h-5 w-5 text-gold" />
            <span className="max-sm:sr-only">Santa Helper</span>
          </Link>
          <nav className="flex items-center gap-0.5 text-sm font-semibold">
            <Link href="/me" className="hidden h-9 items-center whitespace-nowrap rounded-full px-3.5 text-snow/85 transition-colors hover:bg-snow/10 hover:text-snow md:flex">
              {t("mySessions")}
            </Link>
            <LanguageSwitcher tone={tone} short />
            <span className="mx-1.5 h-5 w-px bg-snow/20 max-sm:hidden" aria-hidden />
            <JoinButton tone={tone} />
            <Link href="/new" className="btn-primary ml-1 h-9 whitespace-nowrap px-4 py-0 text-sm">
              <span className="sm:hidden">{th("createShort")}</span>
              <span className="max-sm:hidden">{th("create")}</span>
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4 ${color} [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]`}>
      <Link href="/" className="flex h-11 items-center gap-2 whitespace-nowrap font-display text-lg font-bold md:text-xl">
        <SnowflakeIcon className="h-5 w-5 text-gold" />
        <span>Santa Helper</span>
      </Link>
      <nav className={`flex items-center gap-1 text-sm font-semibold ${tone === "dark" ? "rounded-full bg-ink/55 p-1 ring-1 ring-snow/15 backdrop-blur-md shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]" : ""}`}>
        <Link href="/me" className="flex h-9 items-center whitespace-nowrap rounded-full px-3.5 hover:bg-current/10">
          {t("mySessions")}
        </Link>
        <LanguageSwitcher tone={tone} />
      </nav>
    </header>
  );
}
