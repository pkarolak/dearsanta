"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string; leading?: ReactNode | ((selected: boolean) => ReactNode) };

const lead = (o: SelectOption | undefined, selected: boolean) => (typeof o?.leading === "function" ? o.leading(selected) : o?.leading);

type Props = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Submits the choice with the surrounding form, like a native select. */
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  renderTrigger?: (selected: SelectOption | undefined, open: boolean) => ReactNode;
  align?: "start" | "end";
  minWidth?: number;
  /** A little beak pointing back at the trigger, for compact pill triggers. */
  beak?: boolean;
};

type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number; beak: number };

const gap = 10;
const edge = 12;

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  id,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  className = "field",
  renderTrigger,
  align = "start",
  minWidth = 0,
  beak = false,
}: Props) {
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = value ?? own;
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const [place, setPlace] = useState<Place>({ left: 0, width: 0, top: 0, maxHeight: 320, beak: 0 });
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!button.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    const scrolled = (e: Event) => {
      if (!list.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", scrolled, { passive: true, capture: true });
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", scrolled, { capture: true });
    };
  }, [open]);

  useEffect(() => {
    if (open) items.current[focus]?.focus({ preventScroll: false });
  }, [open, focus]);

  const show = (at = Math.max(0, options.findIndex((o) => o.value === current))) => {
    const b = button.current?.getBoundingClientRect();
    if (!b) return;
    const width = Math.min(Math.max(b.width, minWidth), window.innerWidth - edge * 2);
    const left = Math.min(Math.max(edge, align === "end" ? b.right - width : b.left), window.innerWidth - width - edge);
    const below = window.innerHeight - b.bottom - gap - edge;
    const above = b.top - gap - edge;
    const wanted = Math.min(options.length * 46 + 12, 340);
    const up = below < wanted && above > below;
    setPlace({
      left,
      width,
      ...(up ? { bottom: window.innerHeight - b.top + gap } : { top: b.bottom + gap }),
      maxHeight: Math.min(340, up ? above : below),
      beak: b.left + b.width / 2 - left,
    });
    setFocus(at);
    setOpen(true);
  };

  const choose = (v: string) => {
    setOpen(false);
    button.current?.focus();
    if (v === current) return;
    if (value === undefined) setOwn(v);
    onChange?.(v);
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: focus === last ? 0 : focus + 1, ArrowUp: focus ? focus - 1 : last, Home: 0, End: last };
    if (e.key in moves) {
      e.preventDefault();
      setFocus(moves[e.key]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const key = e.key.toLowerCase();
      const from = options.findIndex((o, i) => i > focus && o.label.toLowerCase().startsWith(key));
      const hit = from >= 0 ? from : options.findIndex((o) => o.label.toLowerCase().startsWith(key));
      if (hit >= 0) setFocus(hit);
    }
  };

  const up = place.bottom !== undefined;

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={renderTrigger ? className : `${className} flex items-center gap-2.5 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {renderTrigger ? (
          renderTrigger(selected, open)
        ) : (
          <>
            {selected?.leading && <span className="-my-1 flex shrink-0">{lead(selected, false)}</span>}
            <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-muted"}`}>{selected?.label ?? placeholder}</span>
            <CaretDown weight="bold" className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </>
        )}
      </button>
      {name && !disabled && <input type="hidden" name={name} value={current} />}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={list}
                id={listId}
                role="listbox"
                aria-label={ariaLabel}
                onKeyDown={onListKey}
                style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, transformOrigin: `${place.beak}px ${up ? "100%" : "0"}` }}
                className="fixed z-[100] rounded-[1.25rem] bg-paper text-ink shadow-[0_24px_50px_-12px_rgb(0_0_0/0.45)] ring-1 ring-ink/10 [text-shadow:none]"
                initial={{ opacity: 0, scale: 0.94, y: up ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: up ? 4 : -4 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              >
                {beak && (
                  <span
                    aria-hidden
                    style={{ left: place.beak - 6 }}
                    className="absolute -top-1.5 h-3 w-3 rotate-45 rounded-[3px] bg-paper ring-1 ring-ink/10 [clip-path:polygon(0_0,100%_0,0_100%)]"
                  />
                )}
                <div className="overflow-y-auto overscroll-contain p-1.5" style={{ maxHeight: place.maxHeight }}>
                  {options.map((o, i) => {
                    const isSelected = o.value === current;
                    return (
                      <button
                        key={o.value}
                        ref={(el) => {
                          items.current[i] = el;
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={focus === i ? 0 : -1}
                        onClick={() => choose(o.value)}
                        onMouseEnter={() => setFocus(i)}
                        className={`flex w-full items-center gap-3 rounded-[0.9rem] px-3 py-2.5 text-left text-[0.95rem] font-semibold outline-none transition-colors ${
                          focus === i ? "bg-cream" : ""
                        } ${isSelected ? "text-berry" : ""}`}
                      >
                        {lead(o, isSelected)}
                        <span className="min-w-0 flex-1 truncate">{o.label}</span>
                        {isSelected && <Check weight="bold" className="h-4 w-4 shrink-0" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/** A small rounded badge in front of an option, e.g. a language code or a currency sign. */
export function OptionBadge({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`grid h-7 min-w-9 shrink-0 place-items-center rounded-md px-1.5 text-[0.7rem] font-bold tracking-wide ${
        active ? "bg-berry text-snow" : "bg-ink/[0.07] text-ink/70"
      }`}
    >
      {children}
    </span>
  );
}
