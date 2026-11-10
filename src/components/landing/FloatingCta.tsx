"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

/** Keeps the header's create button pinned top-right once the header has scrolled away. */
export function FloatingCta() {
  const t = useTranslations("home");
  const [headerGone, setHeaderGone] = useState(false);

  useEffect(() => {
    const anchor = document.querySelector("[data-header-cta]");
    if (!anchor) return;
    const io = new IntersectionObserver(([e]) => setHeaderGone(!e.isIntersecting));
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {headerGone && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-6xl justify-end px-5 py-4 md:py-5"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          <div className="pointer-events-auto rounded-full bg-ink/50 p-1 ring-1 ring-snow/15 backdrop-blur-md">
            <Link href="/new" className="btn-primary whitespace-nowrap px-4 py-2 text-sm md:px-5 md:text-base">
              {t("create")}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
