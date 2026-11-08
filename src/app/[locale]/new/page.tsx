import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { CreateSessionForm } from "@/components/CreateSessionForm";
import { SiteHeader } from "@/components/SiteHeader";

export default function NewSessionPage({ params }: PageProps<"/[locale]/new">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("create");
  return (
    <main className="paper-grain min-h-dvh pb-20">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="font-display text-4xl md:text-5xl">{t("heading")}</h1>
        <p className="mt-3 max-w-xl text-muted">{t("lead")}</p>
        <div className="mt-10">
          <CreateSessionForm />
        </div>
      </div>
    </main>
  );
}
