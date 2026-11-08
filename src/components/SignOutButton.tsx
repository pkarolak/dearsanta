"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { signOutAction } from "@/lib/actions";

export function SignOutButton() {
  const t = useTranslations("mySessions");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-soft"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOutAction();
          router.push("/");
        })
      }
    >
      {t("signOut")}
    </button>
  );
}
