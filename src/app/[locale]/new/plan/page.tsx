import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { CreateSessionForm } from "@/components/CreateSessionForm";
import { PageBand } from "@/components/PageBand";

export default function NewSessionPage({ params }: PageProps<"/[locale]/new/plan">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("create");
  return (
    <main className="felt-texture min-h-dvh pb-20">
      <PageBand title={t("heading")} lead={t("lead")} />
      <div className="mx-auto max-w-3xl px-5 pt-10">
        <CreateSessionForm />
      </div>
    </main>
  );
}
