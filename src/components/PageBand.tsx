import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SantaPuppet } from "./show/SantaPuppet";
import { Cast, Reindeer } from "./show/Vignette";

/** Red wallpaper band at the top of the form pages, with one of the cast peeking in from the side. */
export function PageBand({
  title,
  lead,
  cast = "santa",
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  cast?: "santa" | "reindeer" | "elves";
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-wall text-snow">
      <div className="relative z-10">
        <SiteHeader />
      </div>
      <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-4 md:pb-16 md:pt-8">
        <div className="max-w-[62%] md:max-w-xl">
          <h1 className="break-words font-display text-4xl font-bold leading-[1.05] md:text-5xl">{title}</h1>
          {lead && <p className="mt-3 max-w-lg text-snow/80 md:text-lg">{lead}</p>}
          {children}
        </div>
        <div className="pointer-events-none absolute -bottom-2 right-0 w-[38%] max-w-[17rem] md:right-5">
          {cast === "santa" && <SantaPuppet className="w-full translate-y-[30%]" />}
          {cast === "reindeer" && <Reindeer className="relative! w-full translate-y-[44%]" />}
          {cast === "elves" && <Cast who="elves" className="relative! ml-auto w-[72%] translate-y-[22%]" />}
        </div>
      </div>
    </section>
  );
}
