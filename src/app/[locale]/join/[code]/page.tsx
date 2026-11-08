import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinForm } from "@/components/JoinForm";
import { Santa } from "@/components/Santa";
import { SiteHeader } from "@/components/SiteHeader";
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
    <main className="paper-grain min-h-dvh pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5">
        <div className="mx-auto w-40">
          <Santa className="h-auto w-full" />
        </div>
        <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-berry">{t("eyebrow")}</p>
        <h1 className="mt-2 text-center font-display text-4xl">{session.title}</h1>
        {host && <p className="mt-2 text-center text-muted">{t("hostedBy", { name: host.displayName })}</p>}
        <div className="mt-8">
          {session.status === "done" ? (
            <p className="clay p-6 text-center">{t("closed")}</p>
          ) : (
            <JoinForm code={session.code} defaultEmail={email ?? undefined} />
          )}
        </div>
      </div>
    </main>
  );
}
