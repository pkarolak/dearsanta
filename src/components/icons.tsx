import { Snowflake, SpeakerHigh, SpeakerSlash, WifiHigh } from "@phosphor-icons/react/dist/ssr";

type IconProps = { className?: string };

export function RemoteIcon({ className = "h-4 w-4" }: IconProps) {
  return <WifiHigh weight="bold" className={className} aria-hidden />;
}

export function SpeakerIcon({ className = "h-5 w-5", muted }: IconProps & { muted?: boolean }) {
  const Icon = muted ? SpeakerSlash : SpeakerHigh;
  return <Icon weight="fill" className={className} aria-hidden />;
}

