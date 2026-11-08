import { notFound } from "next/navigation";
import { listMail } from "@/lib/db/repo";
import { devInboxEnabled } from "@/lib/mail/send";

export const dynamic = "force-dynamic";

/** Local stand-in for a mailbox: every e-mail the app "sends" without RESEND_API_KEY lands here. */
export default async function DevMailPage({ searchParams }: PageProps<"/dev/mail">) {
  const allowed = devInboxEnabled() && (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_INBOX === "true");
  if (!allowed) notFound();
  const { id } = await searchParams;
  const mails = await listMail();
  const selected = mails.find((m) => m.id === id) ?? mails[0];

  return (
    <main className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="overflow-y-auto border-r border-ink/10 bg-paper">
        <h1 className="sticky top-0 bg-paper px-5 py-4 font-display text-2xl">Dev inbox</h1>
        {mails.length === 0 && <p className="px-5 text-sm text-muted">No e-mails yet.</p>}
        <ul>
          {mails.map((m) => (
            <li key={m.id}>
              <a
                href={`/dev/mail?id=${m.id}`}
                className={`block border-b border-ink/5 px-5 py-3 hover:bg-cream ${selected?.id === m.id ? "bg-cream" : ""}`}
              >
                <p className="truncate text-sm font-semibold">{m.subject}</p>
                <p className="truncate text-xs text-muted">
                  {m.recipient} · {m.createdAt.toLocaleString()}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <section className="h-dvh">
        {selected ? (
          <iframe title={selected.subject} srcDoc={selected.html} className="h-full w-full bg-white" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Nothing to show</div>
        )}
      </section>
    </main>
  );
}
