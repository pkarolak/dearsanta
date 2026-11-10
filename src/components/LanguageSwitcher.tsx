"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const [place, setPlace] = useState({ top: 0, left: 0, arrow: 0 });
  const list = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!root.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss);
    };
  }, [open]);

  useEffect(() => {
    if (open) items.current[focus]?.focus();
  }, [open, focus]);

  const show = (at = locales.indexOf(locale)) => {
    const b = button.current?.getBoundingClientRect();
    if (b) {
      const width = 208;
      const left = Math.min(Math.max(12, b.right - width), window.innerWidth - width - 12);
      setPlace({ top: b.bottom + 12, left, arrow: b.left + b.width / 2 - left });
    }
    setFocus(at);
    setOpen(true);
  };

  const choose = (l: Locale) => {
    setOpen(false);
    button.current?.focus();
    if (l === locale) return;
    startTransition(() => router.replace(pathname + window.location.search, { locale: l }));
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = locales.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: focus === last ? 0 : focus + 1,
      ArrowUp: focus ? focus - 1 : last,
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setFocus(moves[e.key]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      button.current?.focus();
    }
  };

  const dark = tone === "dark";

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Language: ${localeNames[locale]}`}
        disabled={pending}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pl-3 pr-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          dark ? "hover:bg-snow/10" : "ring-1 ring-current/20 hover:ring-current/40"
        } ${open ? (dark ? "bg-snow/15" : "bg-ink/5") : ""}`}
      >
        <GlobeIcon />
        {localeNames[locale]}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={list}
                id={id}
                role="listbox"
                aria-label="Language"
                onKeyDown={onListKey}
                style={{ top: place.top, left: place.left, transformOrigin: `${place.arrow}px 0` }}
                className="fixed z-[100] w-52 rounded-[1.25rem] bg-paper p-1.5 text-ink shadow-[0_24px_50px_-12px_rgb(0_0_0/0.55)] ring-1 ring-ink/10 [text-shadow:none]"
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              >
                <span
                  aria-hidden
                  style={{ left: place.arrow - 6 }}
                  className="absolute -top-1.5 h-3 w-3 rotate-45 rounded-[3px] bg-paper ring-1 ring-ink/10 [clip-path:polygon(0_0,100%_0,0_100%)]"
                />
                {locales.map((l, i) => {
                  const selected = l === locale;
                  return (
                    <button
                      key={l}
                      ref={(el) => {
                        items.current[i] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      lang={l}
                      tabIndex={focus === i ? 0 : -1}
                      onClick={() => choose(l)}
                      onMouseEnter={() => setFocus(i)}
                      className={`flex w-full items-center gap-3 rounded-[0.9rem] px-3 py-2.5 text-left text-[0.95rem] font-semibold outline-none transition-colors ${
                        focus === i ? "bg-cream" : ""
                      } ${selected ? "text-berry" : ""}`}
                    >
                      <span
                        className={`grid h-7 w-9 shrink-0 place-items-center rounded-md text-[0.7rem] font-bold uppercase tracking-wide ${
                          selected ? "bg-berry text-snow" : "bg-ink/[0.07] text-ink/70"
                        }`}
                      >
                        {l}
                      </span>
                      <span className="flex-1">{localeNames[l]}</span>
                      {selected && (
                        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                          <path
                            d="m3.5 8.5 3 3 6-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 opacity-80" aria-hidden>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 10h15M10 2.5c2.2 2.2 2.2 12.8 0 15M10 2.5c-2.2 2.2-2.2 12.8 0 15" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
