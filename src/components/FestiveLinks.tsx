"use client";

import { ArrowUpRight, MusicNotes, YoutubeLogo } from "@phosphor-icons/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { festiveLinks } from "@/lib/festive";

/**
 * Christmas playlists and a fireplace for after the ceremony. `stage` is sized for the show frame
 * on the big screen; `card` is the version on phones.
 */
export function FestiveLinks({ variant = "card" }: { variant?: "card" | "stage" }) {
  const t = useTranslations("farewell");
  const stage = variant === "stage";

  return (
    <section className={stage ? "rounded-[1.4cqw] bg-snow/95 p-[1.2cqw] shadow-[0_2cqw_4cqw_-1cqw_rgb(0_0_0/0.5)]" : "card p-5"}>
      <h2 className={`font-display font-bold text-ink ${stage ? "px-[0.4cqw] text-[1.6cqw]" : "text-xl"}`}>{t("title")}</h2>
      <ul className={stage ? "mt-[0.8cqw] space-y-[0.5cqw]" : "mt-3 space-y-2"}>
        {festiveLinks.map((link) => {
          const Icon = link.kind === "youtube" ? YoutubeLogo : MusicNotes;
          return (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center hover:bg-ink/5 ${stage ? "gap-[0.8cqw] rounded-[0.8cqw] p-[0.4cqw]" : "gap-3 rounded-2xl p-2"}`}
              >
                <Image
                  src={`/farewell/${link.id}.webp`}
                  alt=""
                  width={240}
                  height={240}
                  unoptimized
                  className={`shrink-0 object-cover shadow ${stage ? "h-[3.6cqw] w-[3.6cqw] rounded-[0.5cqw]" : "h-14 w-14 rounded-xl"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-semibold text-ink ${stage ? "text-[1.15cqw]" : "text-base"}`}>{link.title}</span>
                  <span className={`flex items-center gap-[0.3em] text-muted ${stage ? "text-[0.95cqw]" : "text-sm"}`}>
                    <Icon weight="fill" className={link.kind === "youtube" ? "text-[#e62117]" : "text-[#1db954]"} />
                    {link.kind === "youtube" ? t("watch") : t("listen", { by: link.by })}
                  </span>
                </span>
                <ArrowUpRight weight="bold" className={`shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${stage ? "h-[1.2cqw] w-[1.2cqw]" : "h-5 w-5"}`} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
