import { useTranslations } from "next-intl";
import { Gift } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { JoinButton } from "./JoinButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandMark } from "./BrandMark";
import { brand } from "@/lib/brand";

/**
 * The one bar on every page: a frosted strip with the brand, language, joining a party and starting a new one.
 * `fixed` pins it over the landing page's film and scenes; elsewhere it sits at the top of the page.
 */
export function SiteHeader({ fixed = false }: { fixed?: boolean }) {
  const t = useTranslations("nav");

  return (
    <header className={`${fixed ? "fixed inset-x-0 top-0 z-50" : "relative z-30"} px-3 pt-3 text-snow md:px-5 md:pt-4`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full bg-ink/55 p-1.5 shadow-[0_12px_34px_-14px_rgb(0_0_0/0.65)] ring-1 ring-snow/12 backdrop-blur-xl">
        <Link href="/" className="flex h-9 items-center gap-3 whitespace-nowrap rounded-full pr-2 font-display text-lg font-bold tracking-[0.01em] transition-opacity hover:opacity-90">
          <BrandMark className="h-9 w-9" />
          <span className="max-sm:sr-only">{brand.name}</span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm font-semibold">
          <LanguageSwitcher tone="dark" short />
          <span className="mx-1.5 h-5 w-px bg-snow/20 max-sm:hidden" aria-hidden />
          <Link href="/new" className="btn-primary mr-1 h-9 gap-1.5 whitespace-nowrap px-4 py-0 text-sm">
            <Gift weight="fill" className="h-4 w-4 shrink-0" aria-hidden />
            {t("create")}
          </Link>
          <JoinButton tone="dark" />
        </nav>
      </div>
    </header>
  );
}
