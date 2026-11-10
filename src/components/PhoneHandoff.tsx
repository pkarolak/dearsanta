"use client";

import { DeviceMobile, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { phoneLinkAction } from "@/lib/actions";

/** Shows a QR code the Elf Chief scans to carry on from their phone, as the same elf. */
export function PhoneHandoff({ code, className = "btn-soft" }: { code: string; className?: string }) {
  const t = useTranslations("host.phone");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<{ url: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  const expired = !!link && now >= link.expiresAt;

  useEffect(() => {
    if (!open) return;
    if (!link || expired) {
      let live = true;
      void phoneLinkAction(code, locale).then((res) => {
        if (!live) return;
        if (res.ok) {
          setNow(Date.now());
          setLink({ url: res.url, expiresAt: res.expiresAt });
        } else setFailed(true);
      });
      return () => {
        live = false;
      };
    }
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [open, link, expired, code, locale]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const left = link ? Math.max(0, Math.ceil((link.expiresAt - now) / 1000)) : 0;
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setNow(Date.now());
          setFailed(false);
          setOpen(true);
        }}
      >
        <DeviceMobile weight="bold" className="h-5 w-5" />
        {t("button")}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="phone-handoff-title"
                  className="relative w-full max-w-sm rounded-felt bg-paper p-7 text-center text-ink shadow-[0_40px_80px_-20px_rgb(0_0_0/0.6)]"
                  initial={{ y: 24, scale: 0.94 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 16, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-ink/5"
                    aria-label={t("close")}
                  >
                    <X weight="bold" className="h-5 w-5" />
                  </button>
                  <h2 id="phone-handoff-title" className="font-display text-3xl font-black leading-tight text-berry">
                    {t("title")}
                  </h2>
                  <p className="mt-2 text-muted">{t("body")}</p>
                  <div className="mx-auto mt-5 grid h-[220px] w-[220px] place-items-center rounded-[1.25rem] bg-cream p-3" data-url={link && !expired ? link.url : undefined} data-testid="phone-qr">
                    {link && !expired ? (
                      <QRCodeSVG value={link.url} size={196} bgColor="transparent" fgColor="#2b1810" />
                    ) : (
                      <span className="text-sm text-muted">{failed ? t("failed") : "…"}</span>
                    )}
                  </div>
                  {link && !expired && <p className="mt-3 text-sm font-semibold text-muted">{t("expires", { time })}</p>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
