import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { JoinCodeForm } from "@/components/JoinCodeForm";
import { SiteHeader } from "@/components/SiteHeader";
import { SantaPuppet } from "@/components/show/SantaPuppet";
import { Cast, Reindeer, Vignette } from "@/components/show/Vignette";
import { Link } from "@/i18n/navigation";

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main>
      <section className="bg-wall pb-12 md:pb-20">
        <SiteHeader tone="dark" />
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-stretch md:gap-6">
          <Vignette set="home" focus="42% 50%" priority className="aspect-[5/4] md:order-2 md:aspect-auto md:min-h-[34rem]">
            <SantaPuppet priority className="absolute left-[24%] top-[12%] w-[52%] animate-sway" />
            <Cast who="presents" className="-bottom-[6%] left-[8%] w-[84%]" priority />
            <Cast who="elves" className="-bottom-[2%] -left-[3%] w-[36%]" />
          </Vignette>

          <div className="card flex flex-col justify-center p-7 md:order-1 md:p-12">
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] text-ink md:text-6xl">
              {t.rich("title", { em: (chunks) => chunks })}
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{t("lead")}</p>
            <div className="mt-8">
              <Link href="/new" className="btn-primary text-lg">
                {t("create")}
              </Link>
            </div>
            <div className="mt-8 border-t-2 border-dashed border-ink/15 pt-6">
              <p className="label">{t("haveCode")}</p>
              <JoinCodeForm />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-snow">
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] md:text-5xl">{t("modesTitle")}</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-[1.25fr_1fr_1fr]">
            <ModeCard title={t("modes.sync.title")} body={t("modes.sync.body")}>
              <Vignette set="stage" focus="50% 40%" className="aspect-[16/10] rounded-b-none">
                <SantaPuppet className="absolute left-[30%] top-[16%] w-[40%]" />
                <Cast who="presents" className="-bottom-[10%] left-[20%] w-[60%]" />
              </Vignette>
            </ModeCard>
            <ModeCard title={t("modes.hybrid.title")} body={t("modes.hybrid.body")}>
              <Vignette set="home" focus="88% 50%" className="aspect-[16/10] rounded-b-none">
                <Reindeer className="left-[29%] top-[3%] w-[42%]">
                  <Vignette set="stage" focus="50% 45%" className="absolute inset-[5%] rounded-[4cqw]">
                    <SantaPuppet className="absolute left-[30%] top-[12%] w-[40%]" />
                  </Vignette>
                </Reindeer>
              </Vignette>
            </ModeCard>
            <ModeCard title={t("modes.async.title")} body={t("modes.async.body")}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-felt bg-pine">
                <div className="stitched absolute inset-0 rounded-t-felt text-snow/40" />
                <Cast who="stocking" className="left-[22%] top-[10%] w-[20%] -rotate-6" />
                <Cast who="stocking" className="left-[44%] top-[6%] w-[20%] hue-rotate-[125deg] saturate-[0.8] brightness-[0.85]" />
                <Cast who="stocking" className="left-[64%] top-[12%] w-[20%] rotate-6 hue-rotate-[28deg] saturate-[1.2] brightness-[1.15]" />
              </div>
            </ModeCard>
          </div>
        </div>
      </section>

      <section className="bg-pine text-snow">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 md:py-20">
          {(["fair", "exclusions", "languages"] as const).map((key) => (
            <div key={key}>
              <h3 className="font-display text-2xl font-bold">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 max-w-sm leading-relaxed text-snow/75">{t(`features.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-berry-dark py-10 text-center text-snow/80">
        <p className="font-display text-lg">{t("footer")}</p>
      </footer>
    </main>
  );
}

function ModeCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-felt bg-cream">
      {children}
      <div className="p-7">
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="mt-2 leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}
