import Image from "next/image";

/** The app's mark: Santa's head from the show on a deep pine disc inside a thin gilded ring. */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`relative block shrink-0 rounded-full bg-[linear-gradient(145deg,#ffe7a3_0%,#d9a531_45%,#8a5a12_100%)] p-[1.5px] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.6)] ${className}`}
      aria-hidden
    >
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_30%,#3f8a5f_0%,#1f5a3c_55%,#123826_100%)] shadow-[inset_0_1px_3px_rgb(0_0_0/0.25)]">
        <Image src="/brand/santa-head.webp" alt="" fill unoptimized sizes="48px" className="translate-y-[4%] object-cover" />
      </span>
    </span>
  );
}
