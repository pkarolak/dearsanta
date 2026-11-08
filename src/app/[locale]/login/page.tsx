import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/LoginForm";
import { PageBand } from "@/components/PageBand";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const { expired } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("login");
  return (
    <main className="felt-texture min-h-dvh">
      <PageBand title={t("heading")} lead={t("lead")} cast="reindeer" />
      <div className="mx-auto max-w-md px-5 pt-10">
        {expired && <p className="mb-6 rounded-2xl bg-berry/10 px-4 py-3 font-semibold text-berry">{t("expired")}</p>}
        <div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
