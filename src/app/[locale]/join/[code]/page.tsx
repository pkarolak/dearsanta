import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinForm } from "@/components/JoinForm";
import { PageBand } from "@/components/PageBand";
import { redirect } from "@/i18n/navigation";
import { getVerifiedEmail, getViewer } from "@/lib/auth";
import { getSessionByCode, listParticipants } from "@/lib/db/repo";

export default async function JoinPage({ params }: PageProps<"/[locale]/join/[code]">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await getSessionByCode(code);
  if (!session) notFound();

  const viewer = await getViewer(session);
  if (viewer.participant && viewer.participant.status !== "rejected") {
    redirect({ href: `/s/${session.code}/me`, locale });
  }

  const t = await getTranslations("join");
  const host = (await listParticipants(session.id)).find((p) => p.role === "host");
  const email = await getVerifiedEmail();

  return (
    <main className="felt-texture min-h-dvh pb-16">
      <PageBand title={session.title} lead={host ? t("hostedBy", { name: host.displayName }) : undefined} />
      <div className="mx-auto max-w-md px-5 pt-10">
        <div>
          {session.status === "done" ? (
            <p className="card p-6 text-center">{t("closed")}</p>
          ) : (
            <JoinForm code={session.code} defaultEmail={email ?? undefined} />
          )}
        </div>
      </div>
    </main>
  );
}
