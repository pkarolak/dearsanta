"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";
import { SantaPuppet } from "./show/SantaPuppet";
import { useHoHo } from "./landing/useHoHo";

/* The puppet sits in a box 1.5× wider and taller than the ring, bottom-aligned with it. The mask keeps
   the lower half inside the pine disc and lets everything above the disc's centre (hat, pompom) spill out. */
const popOut = {
  maskImage:
    "linear-gradient(#000,#000), radial-gradient(ellipse 30.6% 30.6% at 50% 66.7%, #000 98%, transparent 100%)",
  maskSize: "100% 66.7%, 100% 100%",
  maskPosition: "top, center",
  maskRepeat: "no-repeat",
} as const;

/** The app's mark: the show's felt Santa peeking out of a pine disc in a thin gilded ring. Says "ho, ho" when poked. */
export function BrandMark({ className = "h-8 w-8", talk = 0 }: { className?: string; talk?: number }) {
  const level = useHoHo(talk);
  return (
    <span className={`relative block shrink-0 ${className}`} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,#ffe7a3_0%,#d9a531_45%,#8a5a12_100%)] p-[1.5px] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.6)]">
        <span className="block h-full w-full rounded-full bg-[radial-gradient(circle_at_50%_30%,#3f8a5f_0%,#1f5a3c_55%,#123826_100%)] shadow-[inset_0_1px_3px_rgb(0_0_0/0.25)]" />
      </span>
      <span className="pointer-events-none absolute -left-1/4 bottom-0 h-[150%] w-[150%]" style={popOut}>
        <span className="absolute -left-[5%] top-[17.6%] block w-[103%] origin-[50%_35%] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[4%] group-hover:-rotate-[8deg] group-active:-translate-y-[4%]">
          <SantaPuppet level={level} />
        </span>
      </span>
    </span>
  );
}

/** The bar's home link: the mark and the name. Santa greets once on load and again whenever the link is hovered or tapped. */
export function BrandLink() {
  const [talk, setTalk] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setTalk((n) => n + 1), 900);
    return () => clearTimeout(id);
  }, []);
  const poke = () => setTalk((n) => n + 1);
  return (
    <Link
      href="/"
      onPointerEnter={poke}
      onFocus={poke}
      className="group flex h-9 items-center gap-3 whitespace-nowrap rounded-full pr-2 font-display text-lg font-bold tracking-[0.01em]"
    >
      <BrandMark className="h-9 w-9" talk={talk} />
      <span className="max-sm:sr-only">{brand.name}</span>
    </Link>
  );
}
