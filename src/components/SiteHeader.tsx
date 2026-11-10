import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SnowflakeIcon } from "./icons";

export function SiteHeader({ tone = "light", cta = false }: { tone?: "light" | "dark"; cta?: boolean }) {
  const t = useTranslations("nav");
  const th = useTranslations("home");
  const color = tone === "dark" ? "text-snow" : "text-ink";
  return (
    <header className={`mx-auto flex [text-shadow:0_1px_8px_rgb(0_0_0/0.5)] w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 md:py-5 ${color}`}>
      <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold md:text-xl">
        <SnowflakeIcon className="h-5 w-5 text-gold" />
        <span className={cta ? "max-md:sr-only" : undefined}>Santa Helper</span>
      </Link>
      <nav className={`flex items-center gap-1 text-sm font-semibold ${tone === "dark" ? "rounded-full bg-ink/50 p-1 ring-1 ring-snow/15 backdrop-blur-md" : ""}`}>
        <Link href="/me" className={`whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-current/10 ${cta ? "hidden md:block" : ""}`}>
          {t("mySessions")}
        </Link>
        <LanguageSwitcher tone={tone} />
        {cta && (
          <Link href="/new" className="btn-primary whitespace-nowrap px-4 py-2 text-sm md:px-5 md:text-base" data-header-cta>
            {th("create")}
          </Link>
        )}
      </nav>
    </header>
  );
}
