import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SnowflakeIcon } from "./icons";

export function SiteHeader({ tone = "light", cta = false }: { tone?: "light" | "dark"; cta?: boolean }) {
  const t = useTranslations("nav");
  const th = useTranslations("home");
  const color = tone === "dark" ? "text-snow" : "text-ink";
  return (
    <header className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 md:py-5 ${color}`}>
      <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold md:text-xl">
        <SnowflakeIcon className="h-5 w-5 text-gold" />
        <span className={cta ? "max-sm:sr-only" : undefined}>Santa Helper</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm font-semibold">
        <Link href="/me" className={`whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-current/10 ${cta ? "hidden sm:block" : ""}`}>
          {t("mySessions")}
        </Link>
        <LanguageSwitcher />
        {cta && (
          <Link href="/new" className="btn-primary ml-1 whitespace-nowrap px-4 py-2 text-sm md:text-base">
            {th("create")}
          </Link>
        )}
      </nav>
    </header>
  );
}
