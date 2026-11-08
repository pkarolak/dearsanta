import { notFound } from "next/navigation";
import { ShowSheet } from "./ShowSheet";

/** Design sheet: every chapter of Santa's show and a crowd of avatars, with sample data. Dev only. */
export default async function DevShowPage({ searchParams }: PageProps<"/dev/show">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { step, n, level } = await searchParams;
  return (
    <ShowSheet
      step={typeof step === "string" ? step : null}
      count={typeof n === "string" ? Number(n) : 5}
      level={typeof level === "string" ? Number(level) : 0}
    />
  );
}
