import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PageBand } from "@/components/PageBand";
import { RemoteWizard } from "@/components/RemoteWizard";

export default function RemoteSessionPage({ params }: PageProps<"/[locale]/new/remote">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("remote");
  return (
    <main className="felt-texture min-h-dvh pb-20">
      <PageBand title={t("heading")} lead={t("lead")} />
      <div className="mx-auto max-w-2xl px-5 pt-10">
        <RemoteWizard />
      </div>
    </main>
  );
}
