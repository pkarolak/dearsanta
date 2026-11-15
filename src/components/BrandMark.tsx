import Image from "next/image";

/** The app's mark: Santa's head from the show, in a round badge next to the name. */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-cream ring-2 ring-gold/70 ${className}`} aria-hidden>
      <Image src="/brand/santa-head.webp" alt="" fill unoptimized sizes="40px" className="scale-110 object-cover object-top" />
    </span>
  );
}
