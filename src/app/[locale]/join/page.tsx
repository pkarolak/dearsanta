import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinCodeForm } from "@/components/JoinCodeForm";
import { PageBand } from "@/components/PageBand";

export default async function JoinByCodePage({ params }: PageProps<"/[locale]/join">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  return (
    <main className="felt-texture min-h-dvh pb-16">
      <PageBand title={t("joinTitle")} lead={t("joinHint")} />
      <div className="mx-auto flex max-w-md justify-center px-5 pt-10">
        <div className="card w-full p-6">
          <JoinCodeForm autoFocus />
        </div>
      </div>
    </main>
  );
}
