import Image from "next/image";
import { Avatar } from "../Avatar";
import { RemoteIcon } from "../icons";
import type { AvatarConfig } from "@/lib/avatar";

const colours = ["", "hue-rotate(125deg) saturate(0.8) brightness(0.85)", "hue-rotate(28deg) saturate(1.2) brightness(1.15)"];

type Props = {
  name: string;
  avatar: AvatarConfig;
  index: number;
  remote?: boolean;
  remoteLabel?: string;
  className?: string;
};

/** A felt stocking with the elf's name on the cuff and their portrait sewn on as a patch. */
export function Stocking({ name, avatar, index, remote, remoteLabel, className = "" }: Props) {
  return (
    <div className={`@container relative aspect-[420/899] ${className}`}>
      <Image
        src="/show/stocking.webp"
        alt=""
        fill
        sizes="12vw"
        unoptimized
        className="object-contain"
        style={{ filter: colours[index % colours.length] || undefined }}
      />
      <p className="absolute inset-x-[16%] top-[14%] truncate text-center font-display text-[17cqw] font-bold leading-[1.6] text-ink">
        {name}
      </p>
      <div className="absolute left-[24%] top-[44%] w-[52%]">
        <Avatar config={avatar} className="h-auto w-full rounded-full" title={name} />
        {remote && (
          <span className="absolute -right-[14%] bottom-0 flex aspect-square w-[42%] items-center justify-center rounded-full bg-gold text-ink" title={remoteLabel}>
            <RemoteIcon className="h-[62%] w-[62%]" />
          </span>
        )}
      </div>
    </div>
  );
}
