import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HostPanel } from "@/components/HostPanel";
import { redirect } from "@/i18n/navigation";
import { getViewer } from "@/lib/auth";
import { getSessionByCode } from "@/lib/db/repo";
import { buildState } from "@/lib/state";
import { requestOrigin } from "@/lib/urls";

export default async function HostPage({ params }: PageProps<"/[locale]/s/[code]/host">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await getSessionByCode(code);
  if (!session) notFound();
  const viewer = await getViewer(session);
  if (!viewer.isHost) redirect({ href: viewer.participant ? `/s/${session.code}/me` : "/login", locale });

  const origin = await requestOrigin();
  const state = await buildState(session, viewer, locale);
  return (
    <HostPanel
      code={session.code}
      initial={state}
      joinUrl={`${origin}/${locale}/join/${session.code}`}
      screenUrl={`${origin}/${locale}/s/${session.code}/screen?k=${session.screenKey}`}
    />
  );
}
