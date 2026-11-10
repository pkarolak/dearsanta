"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { GiftIcon } from "../icons";
import { Link } from "@/i18n/navigation";

export function FloatingCta() {
  const t = useTranslations("home");
  const [pastHero, setPastHero] = useState(false);
  const [ctaInView, setCtaInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setCtaInView(visible.size > 0);
    });
    document.querySelectorAll("[data-cta]").forEach((el) => io.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {pastHero && !ctaInView && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 md:bottom-auto md:left-auto md:top-5 md:right-6"
          initial={{ y: 24, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Link
            href="/new"
            className="btn-primary pointer-events-auto text-lg shadow-[0_10px_30px_-8px_rgb(0_0_0/0.6),inset_0_-3px_0_rgb(0_0_0/0.18)] ring-2 ring-gold/70"
          >
            <GiftIcon className="h-5 w-5" />
            {t("create")}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
