import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/LoginForm";
import { SiteHeader } from "@/components/SiteHeader";

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const { expired } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("login");
  return (
    <main className="paper-grain min-h-dvh">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pt-8">
        <h1 className="font-display text-4xl">{t("heading")}</h1>
        <p className="mt-2 text-muted">{t("lead")}</p>
        {expired && <p className="mt-4 rounded-2xl bg-berry/10 px-4 py-3 text-berry">{t("expired")}</p>}
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
