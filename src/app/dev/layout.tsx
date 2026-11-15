import { fontVariables } from "../fonts";
import "../globals.css";
import { brand } from "@/lib/brand";

export const metadata = { title: `Dev inbox · ${brand.name}` };

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-cream font-sans text-ink">{children}</body>
    </html>
  );
}
