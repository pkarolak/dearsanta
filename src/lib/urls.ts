import { headers } from "next/headers";

/**
 * Origin as seen by the current request. On a home network this is the laptop's LAN address,
 * which is exactly what phones scanning the QR code need.
 */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (!host) return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${proto.split(",")[0]}://${host}`;
}
