import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Avatar } from "@/components/Avatar";
import { JoinCodeForm } from "@/components/JoinCodeForm";
import { NightScene } from "@/components/NightScene";
import { Santa } from "@/components/Santa";
import { SiteHeader } from "@/components/SiteHeader";
import { Link } from "@/i18n/navigation";
import { seededAvatar } from "@/lib/avatar";

const demoElves = ["ola", "tom", "maria", "jan", "lucia"].map((s) => seededAvatar(s));

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main>
      <NightScene className="min-h-[92dvh]">
        <SiteHeader tone="dark" />
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-24 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">{t("eyebrow")}</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-7xl">
              {t.rich("title", { em: (chunks) => <em className="text-gold">{chunks}</em> })}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-snow/80">{t("lead")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/new" className="btn-primary text-lg">
                {t("create")}
              </Link>
            </div>
            <div className="clay-night mt-6 inline-block p-4">
              <p className="mb-2 text-sm text-snow/80">{t("haveCode")}</p>
              <JoinCodeForm />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="animate-float">
              <Santa className="h-auto w-full drop-shadow-2xl" />
            </div>
            <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 -space-x-3">
              {demoElves.map((a, i) => (
                <div key={i} className="h-14 w-14 rounded-full ring-4 ring-night-2">
                  <Avatar config={a} className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </NightScene>

      <section className="paper-grain">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-5xl">{t("modesTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(["sync", "hybrid", "async"] as const).map((mode, i) => (
              <article key={mode} className="clay p-7">
                <p className="font-display text-5xl text-berry/80">0{i + 1}</p>
                <h3 className="mt-3 font-display text-2xl">{t(`modes.${mode}.title`)}</h3>
                <p className="mt-2 text-muted">{t(`modes.${mode}.body`)}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {(["fair", "exclusions", "languages"] as const).map((key) => (
              <div key={key} className="border-t-2 border-ink/10 pt-5">
                <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted">{t(`features.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-pine-dark py-10 text-center text-sm text-snow/70">
        <p className="font-display italic">{t("footer")}</p>
      </footer>
    </main>
  );
}
