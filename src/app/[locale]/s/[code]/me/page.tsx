import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ElfRoom } from "@/components/ElfRoom";
import { redirect } from "@/i18n/navigation";
import { getViewer } from "@/lib/auth";
import { getSessionByCode } from "@/lib/db/repo";
import { buildState } from "@/lib/state";

export default async function ElfPage({ params }: PageProps<"/[locale]/s/[code]/me">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await getSessionByCode(code);
  if (!session) notFound();
  const viewer = await getViewer(session);
  if (!viewer.participant) redirect({ href: `/join/${session.code}`, locale });
  const state = await buildState(session, viewer, locale);
  return <ElfRoom code={session.code} initial={state} />;
}
