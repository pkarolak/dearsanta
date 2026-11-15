"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Problem = { field: Field; message: string };

const BUBBLE_ID = "form-error";

/**
 * Replaces the browser's own validation bubbles on every form with ours: the first invalid field gets a red ring
 * and a message in the page's language right under it, until it's corrected.
 */
export function FormErrors() {
  const t = useTranslations("validation");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const messageFor = (field: Field) => {
      const v = field.validity;
      if (v.valueMissing) return field.type === "checkbox" ? t("check") : t("required");
      if (v.typeMismatch) return field.type === "email" ? t("email") : field.type === "url" ? t("url") : t("invalid");
      if (v.tooShort) return t("tooShort", { min: (field as HTMLInputElement).minLength });
      if (v.tooLong) return t("tooLong", { max: (field as HTMLInputElement).maxLength });
      if (v.rangeUnderflow) return t("min", { min: (field as HTMLInputElement).min });
      if (v.rangeOverflow) return t("max", { max: (field as HTMLInputElement).max });
      if (v.badInput) return t("number");
      return t("invalid");
    };

    let first: Field | null = null;
    const onInvalid = (e: Event) => {
      const field = e.target as Field;
      e.preventDefault();
      field.setAttribute("aria-invalid", "true");
      // A submit fires "invalid" for every bad field at once; only the first one speaks up.
      if (first) return;
      first = field;
      queueMicrotask(() => (first = null));
      field.setAttribute("aria-describedby", BUBBLE_ID);
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: "center", behavior: "smooth" });
      setProblem({ field, message: messageFor(field) });
    };
    const onEdit = (e: Event) => {
      const field = e.target as Field;
      if (field.getAttribute("aria-invalid") !== "true" || !field.checkValidity?.()) return;
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
      setProblem((p) => (p?.field === field ? null : p));
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, [t]);

  useEffect(() => {
    if (!problem) return;
    const place = () => (problem.field.isConnected ? setRect(problem.field.getBoundingClientRect()) : setProblem(null));
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [problem]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {problem && rect && (
        <motion.div
          key={problem.message}
          id={BUBBLE_ID}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed z-[100] max-w-[min(22rem,calc(100vw-2rem))]"
          style={{ left: Math.max(16, rect.left + 12), top: rect.bottom + 10 }}
        >
          <span aria-hidden className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 rounded-[2px] bg-berry" />
          <span className="relative flex items-center gap-2 rounded-2xl bg-berry px-3.5 py-2 text-sm font-semibold text-snow shadow-[0_12px_28px_-10px_rgb(120_20_30/0.7)]">
            <WarningCircle weight="fill" className="h-4.5 w-4.5 shrink-0 text-gold" />
            {problem.message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
