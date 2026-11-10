import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { TvCodeForm } from "@/components/TvCodeForm";

export default async function TvPage({ params }: PageProps<"/[locale]/tv">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(60%_60%_at_50%_40%,#2a1240,#141d40_55%,#0b1230)] text-snow">
      <SiteHeader tone="dark" />
      <TvCodeForm />
    </main>
  );
}
