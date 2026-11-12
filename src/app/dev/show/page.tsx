import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../messages/en.json";
import { ShowSheet } from "./ShowSheet";

/** Design sheet: every chapter of Santa's show and a crowd of avatars, with sample data. Dev only. */
export default async function DevShowPage({ searchParams }: PageProps<"/dev/show">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { step, n, level, draw } = await searchParams;
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ShowSheet
        step={typeof step === "string" ? step : null}
        count={typeof n === "string" ? Number(n) : 5}
        level={typeof level === "string" ? Number(level) : 0}
        draw={draw === "spinning" || draw === "sequence" ? draw : undefined}
      />
    </NextIntlClientProvider>
  );
}
