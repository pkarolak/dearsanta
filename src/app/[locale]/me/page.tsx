import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageBand } from "@/components/PageBand";
import { SignOutButton } from "@/components/SignOutButton";
import { Link, redirect } from "@/i18n/navigation";
import { getVerifiedEmail } from "@/lib/auth";
import { listSessionsForEmail } from "@/lib/db/repo";

export default async function MySessionsPage({ params }: PageProps<"/[locale]/me">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const email = await getVerifiedEmail();
  if (!email) redirect({ href: "/login", locale });
  const sessions = await listSessionsForEmail(email!);
  const t = await getTranslations("mySessions");
  const format = await getFormatter();

  return (
    <main className="felt-texture min-h-dvh pb-16">
      <PageBand title={t("heading")} lead={email} cast="elves">
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/new" className="btn-pine">{t("new")}</Link>
          <SignOutButton />
        </div>
      </PageBand>
      <div className="mx-auto max-w-3xl px-5 pt-10">
        <ul className="space-y-4">
          {sessions.length === 0 && <li className="card p-6 text-muted">{t("empty")}</li>}
          {sessions.map(({ session, role }) => (
            <li key={session.id}>
              <Link
                href={role === "host" ? `/s/${session.code}/host` : `/s/${session.code}/me`}
                className="card flex items-center justify-between gap-4 p-5 transition hover:bg-cream-dark"
              >
                <div>
                  <p className="font-display text-xl font-bold">{session.title}</p>
                  <p className="text-sm text-muted">
                    {session.scheduledAt ? format.dateTime(session.scheduledAt, { dateStyle: "medium", timeStyle: "short" }) : t("noDate")}
                    {" · "}
                    {t(`status.${session.status}`)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${role === "host" ? "bg-berry text-white" : "bg-pine/15 text-pine"}`}>
                  {role === "host" ? t("roleHost") : t("roleElf")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
