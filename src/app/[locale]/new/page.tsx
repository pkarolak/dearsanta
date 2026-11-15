import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { QuickStart } from "@/components/QuickStart";
import { SiteHeader } from "@/components/SiteHeader";

export default function NewSessionPage({ params }: PageProps<"/[locale]/new">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#1c0c0b] text-snow">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_40%,rgb(160_40_40/0.45),transparent_70%),radial-gradient(45%_55%_at_10%_80%,rgb(29_90_58/0.3),transparent_70%)]"
      />
      <div aria-hidden className="felt-texture absolute inset-0 opacity-60" />
      <div className="absolute inset-x-0 top-0 z-20">
        <SiteHeader />
      </div>
      <QuickStart />
    </main>
  );
}
