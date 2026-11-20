"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { resumeHostAction } from "@/lib/actions";

/** Shown while a guest link is open in a browser that still has the host seat. */
export function ResumeHost({ code }: { code: string }) {
  const t = useTranslations("elf");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="btn-primary w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await resumeHostAction(code);
          if (result.ok) router.push(`/s/${code}/host`);
        })
      }
    >
      {t("resumeHost")}
    </button>
  );
}
