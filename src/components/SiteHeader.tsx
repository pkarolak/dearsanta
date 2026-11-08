import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SnowflakeIcon } from "./icons";

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const t = useTranslations("nav");
  const color = tone === "dark" ? "text-snow" : "text-ink";
  return (
    <header className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 ${color}`}>
      <Link href="/" className="flex items-center gap-2 font-display text-xl italic">
        <SnowflakeIcon className="h-5 w-5 text-gold" />
        Santa Helper
      </Link>
      <nav className="flex items-center gap-2 text-sm font-semibold">
        <Link href="/me" className="rounded-full px-3 py-1.5 hover:bg-current/10">
          {t("mySessions")}
        </Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
