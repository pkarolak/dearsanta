type IconProps = { className?: string };

export function GiftIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="8" y="26" width="48" height="32" rx="6" fill="#B8332C" />
      <rect x="4" y="18" width="56" height="12" rx="5" fill="#D04A41" />
      <rect x="28" y="18" width="8" height="40" fill="#E7B54A" />
      <path d="M32 18 C24 4 10 8 14 16 C17 21 28 19 32 18 C36 19 47 21 50 16 C54 8 40 4 32 18 Z" fill="#E7B54A" />
    </svg>
  );
}

export function RemoteIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SpeakerIcon({ className = "h-5 w-5", muted }: IconProps & { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  );
}

export function SnowflakeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2M4 10.5l2.6-.9-.5-2.7M20 13.5l-2.6.9.5 2.7M4 13.5l2.6.9-.5 2.7M20 10.5l-2.6-.9.5-2.7" />
    </svg>
  );
}
