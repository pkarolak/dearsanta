import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PersonalReveal } from "@/components/PersonalReveal";
import { redirect } from "@/i18n/navigation";
import { getViewer } from "@/lib/auth";
import { buildPersonalScript } from "@/lib/ceremony/script";
import { getAssignmentForGiver, getSessionByCode } from "@/lib/db/repo";
import { formatMoney } from "@/lib/i18n-server";

export default async function RevealPage({ params }: PageProps<"/[locale]/s/[code]/reveal">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const session = await getSessionByCode(code);
  if (!session) notFound();
  const viewer = await getViewer(session);
  const me = viewer.participant;
  if (!me) redirect({ href: `/join/${session.code}`, locale });
  if (session.mode !== "async" || !session.drawnAt || me!.status !== "approved") {
    redirect({ href: `/s/${session.code}/me`, locale });
  }
  const assignment = await getAssignmentForGiver(session.id, me!.id);
  if (!assignment) redirect({ href: `/s/${session.code}/me`, locale });

  const budget = session.budgetAmount ? { amount: session.budgetAmount, currency: session.currency } : null;
  const script = await buildPersonalScript({
    locale,
    title: session.title,
    name: me!.displayName,
    receiver: assignment!.receiver.displayName,
    budget,
  });

  return (
    <PersonalReveal
      code={session.code}
      title={session.title}
      receiver={{ displayName: assignment!.receiver.displayName, avatar: assignment!.receiver.avatar }}
      budget={budget ? formatMoney(budget.amount, budget.currency, locale) : null}
      script={script}
    />
  );
}
