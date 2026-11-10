"use client";

import { CaretDown } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";

/** A row that keeps its details folded away until asked for, with a one-line summary of what is inside. */
export function Disclosure({
  title,
  summary,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className="border-t border-ink/10 first:border-t-0">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-ink/[0.03] md:px-6"
        >
          {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-pine">{icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold leading-tight">{title}</span>
            {summary && <span className="mt-0.5 block truncate text-sm text-muted">{summary}</span>}
          </span>
          <CaretDown weight="bold" className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 md:px-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
