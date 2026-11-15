import { QRCodeSVG } from "qrcode.react";

/** What the reindeer writes on his board in the lobby: the QR code and the session code. */
export function JoinBoard({ url, code, title, hint }: { url: string; code: string; title: string; hint: string }) {
  return (
    <div className="flex h-full items-center gap-[4.5cqw] py-[9cqw] pl-[6.5cqw] pr-[4cqw]">
      <QRCodeSVG value={url} className="aspect-square h-full w-auto shrink-0" fgColor="#2b1810" bgColor="#ffffff" level="M" marginSize={0} />
      <div className="min-w-0 -rotate-2 font-hand text-ink">
        <p className="text-[8.6cqw] font-bold leading-[0.95]">{title}</p>
        <p className="mt-[2.4cqw] text-[5.6cqw] font-semibold leading-[1.05] text-muted">{hint}</p>
        <p className="relative mt-[0.6cqw] inline-block text-[11.5cqw] font-bold leading-none tracking-[0.04em] text-berry">
          {code}
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="absolute -bottom-[0.6cqw] left-0 h-[1.6cqw] w-full" aria-hidden>
            <path d="M2 5 C 25 2, 55 7, 98 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </p>
      </div>
    </div>
  );
}

/** The gift budget written on the board while Santa explains the rules. */
export function BudgetBoard({ label, budget, note }: { label: string; budget: string; note: string }) {
  return (
    <div className="flex h-full -rotate-1 flex-col justify-center p-[7cqw] text-center font-hand">
      <p className="text-[8cqw] font-semibold leading-none text-muted">{label}</p>
      <p className="text-[23cqw] font-bold leading-[0.95] text-berry">{budget}</p>
      <p className="mt-[2cqw] text-[8cqw] font-bold leading-[1] text-ink">{note}</p>
    </div>
  );
}
