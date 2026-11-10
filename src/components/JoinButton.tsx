"use client";

import { SignIn } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { JoinCodeForm } from "./JoinCodeForm";

type Place = { top: number; right: number; wide: boolean };

/** The guest's way in from anywhere on the landing page: a button that drops down the code field. */
export function JoinButton({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place>();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const inside = button.current?.contains(e.target as Node) || panel.current?.contains(e.target as Node);
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !inside) setOpen(false);
    };
    // The header sits in a blurred pill that would clip the panel, so the panel lives on the body
    // and follows the button every frame, since the film scales its header while scrolling.
    let frame = 0;
    const follow = () => {
      const r = button.current!.getBoundingClientRect();
      const next = { top: Math.round(r.bottom + 8), right: Math.round(window.innerWidth - r.right), wide: window.innerWidth >= 768 };
      setPlace((p) => (p && p.top === next.top && p.right === next.right && p.wide === next.wide ? p : next));
      frame = requestAnimationFrame(follow);
    };
    follow();
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="join-panel"
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold ring-1 md:text-base ${
          tone === "dark" ? "bg-snow/15 text-snow ring-snow/30 hover:bg-snow/25" : "bg-ink/5 text-ink ring-ink/15 hover:bg-ink/10"
        }`}
      >
        <SignIn weight="bold" className="h-4 w-4" />
        {t("joinOpen")}
      </button>
      {place &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panel}
                id="join-panel"
                style={place.wide ? { top: place.top, right: place.right, width: "22rem" } : { top: place.top, left: 16, right: 16 }}
                className="fixed z-[60] rounded-[1.2rem] bg-paper p-4 text-left text-ink shadow-[0_24px_50px_-20px_rgb(0_0_0/0.7)]"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
              >
                <p className="font-display text-lg font-bold">{t("joinTitle")}</p>
                <p className="mb-3 mt-1 text-sm text-ink/70">{t("joinHint")}</p>
                <JoinCodeForm autoFocus />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
