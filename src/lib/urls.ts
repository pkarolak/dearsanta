import { headers } from "next/headers";

type Env = Record<string, string | undefined>;

/**
 * Origin as seen by the current request. On a home network this is the laptop's LAN address,
 * which is exactly what phones scanning the QR code need. Production never uses that address.
 */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host && isLocalHost(host) ? "http" : "https");
  const fromRequest = host ? `${proto.split(",")[0]}://${host}` : "";
  if (isProduction()) {
    if (fromRequest && !isLocalOrigin(fromRequest)) return fromRequest;
    return appOrigin();
  }
  if (fromRequest) return fromRequest;
  return appOrigin();
}

/**
 * Base URL for e-mail and magic links. Locally this may be a LAN address so phones can open it.
 * In production a missing or private APP_URL must not become localhost or a home-network IP.
 */
export function appOrigin(env: Env = process.env) {
  const configured = (env.APP_URL ?? "").replace(/\/$/, "");
  if (isProduction(env)) {
    if (!configured || isLocalOrigin(configured)) {
      throw new Error("APP_URL must be the public https origin in production");
    }
    return configured;
  }
  return configured || "http://localhost:3000";
}

function isProduction(env: Env = process.env) {
  return Boolean(env.VERCEL) || env.NODE_ENV === "production";
}

/** The dev server on this computer or the home network, which only speaks plain http. */
export function isLocalHost(host: string) {
  const name = host.replace(/:\d+$/, "");
  return name === "localhost" || name.endsWith(".local") || /^(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(name);
}

export function isLocalOrigin(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `http://${value}`);
    return isLocalHost(url.host);
  } catch {
    return true;
  }
}
