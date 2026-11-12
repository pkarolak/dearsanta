import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { JoinButton } from "./JoinButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SnowflakeIcon } from "./icons";

/**
 * With `cta` this is the landing page's bar: fixed on top for the whole scroll, every part in its own frosted pill
 * so it reads the same over the film and every scene after it.
 */
export function SiteHeader({ tone = "light", cta = false }: { tone?: "light" | "dark"; cta?: boolean }) {
  const t = useTranslations("nav");
  const th = useTranslations("home");
  const color = tone === "dark" ? "text-snow" : "text-ink";
  const pill = tone === "dark" ? "rounded-full bg-ink/55 p-1 ring-1 ring-snow/15 backdrop-blur-md shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]" : "";
  return (
    <header
      className={`${cta ? "fixed inset-x-0 top-0 z-50" : ""} mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4 ${color} ${
        cta ? "" : "[text-shadow:0_1px_8px_rgb(0_0_0/0.5)]"
      }`}
    >
      <Link
        href="/"
        className={`flex h-11 items-center gap-2 whitespace-nowrap font-display text-lg font-bold md:text-xl ${cta ? `${pill} px-3.5 md:px-4` : ""}`}
      >
        <SnowflakeIcon className="h-5 w-5 text-gold" />
        <span className={cta ? "max-md:sr-only" : undefined}>Santa Helper</span>
      </Link>
      <nav className={`flex items-center gap-1 text-sm font-semibold ${pill}`}>
        <Link href="/me" className={`flex h-9 items-center whitespace-nowrap rounded-full px-3.5 hover:bg-current/10 ${cta ? "hidden md:flex" : ""}`}>
          {t("mySessions")}
        </Link>
        <LanguageSwitcher tone={tone} compact={cta} />
        {cta && <JoinButton tone={tone} />}
        {cta && (
          <Link href="/new" className="btn-primary h-9 whitespace-nowrap px-4 py-0 text-sm">
            <span className="sm:hidden">{th("createShort")}</span>
            <span className="max-sm:hidden">{th("create")}</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
