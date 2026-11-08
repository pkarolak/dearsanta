import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
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
    <main className="paper-grain min-h-dvh pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">{t("heading")}</h1>
            <p className="mt-1 text-muted">{email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/new" className="btn-primary">{t("new")}</Link>
            <SignOutButton />
          </div>
        </div>
        <ul className="mt-8 space-y-4">
          {sessions.length === 0 && <li className="clay p-6 text-muted">{t("empty")}</li>}
          {sessions.map(({ session, role }) => (
            <li key={session.id}>
              <Link
                href={role === "host" ? `/s/${session.code}/host` : `/s/${session.code}/me`}
                className="clay flex items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-display text-xl">{session.title}</p>
                  <p className="text-sm text-muted">
                    {session.scheduledAt ? format.dateTime(session.scheduledAt, { dateStyle: "medium", timeStyle: "short" }) : t("noDate")}
                    {" · "}
                    {t(`status.${session.status}`)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${role === "host" ? "bg-berry text-white" : "bg-pine/15 text-pine"}`}>
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
