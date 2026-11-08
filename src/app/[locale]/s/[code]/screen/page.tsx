import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScreenView } from "@/components/ScreenView";
import { getViewer } from "@/lib/auth";
import { getSessionByCode } from "@/lib/db/repo";
import { buildState } from "@/lib/state";
import { requestOrigin } from "@/lib/urls";

export default async function ScreenPage({ params, searchParams }: PageProps<"/[locale]/s/[code]/screen">) {
  const { locale, code } = await params;
  const { k } = await searchParams;
  setRequestLocale(locale);
  const session = await getSessionByCode(code);
  if (!session) notFound();
  const screenKey = typeof k === "string" ? k : null;
  const viewer = await getViewer(session, screenKey);

  if (!viewer.isScreen && !viewer.isHost) {
    const t = await getTranslations("screen");
    return (
      <main className="flex min-h-dvh items-center justify-center bg-wall px-6 text-center text-snow">
        <div>
          <h1 className="font-display text-3xl">{t("noAccessTitle")}</h1>
          <p className="mt-2 text-snow/70">{t("noAccessBody")}</p>
        </div>
      </main>
    );
  }

  const origin = await requestOrigin();
  const state = await buildState(session, { ...viewer, isScreen: true }, locale);
  return (
    <ScreenView
      code={session.code}
      screenKey={viewer.isScreen ? screenKey : null}
      initial={state}
      joinUrl={`${origin}/${locale}/join/${session.code}`}
    />
  );
}
