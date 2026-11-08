"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionState } from "@/lib/state";

type Options = { screenKey?: string | null; initial?: SessionState | null };

/**
 * Keeps a session's state fresh: an SSE stream announces version bumps and the state is refetched.
 * A slow poll is the safety net for networks that break event streams.
 */
export function useSessionState(code: string, locale: string, { screenKey, initial }: Options = {}) {
  const [state, setState] = useState<SessionState | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const clockOffset = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);
  const again = useRef(false);

  const refresh = useCallback(() => {
    if (inflight.current) {
      again.current = true;
      return inflight.current;
    }
    const fetchOnce = async () => {
      const params = new URLSearchParams({ locale });
      if (screenKey) params.set("screen", screenKey);
      try {
        const res = await fetch(`/api/s/${code}/state?${params}`, { cache: "no-store" });
        if (!res.ok) {
          setError(res.status === 403 ? "forbidden" : res.status === 404 ? "not_found" : "error");
          return;
        }
        const next = (await res.json()) as SessionState;
        clockOffset.current = Date.now() - next.serverNow;
        setError(null);
        setState(next);
      } catch {
        setError("offline");
      }
    };
    const loop = async () => {
      // Coalesce bursts of change notifications into as few fetches as possible.
      do {
        again.current = false;
        await fetchOnce();
      } while (again.current);
    };
    inflight.current = loop().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, [code, locale, screenKey]);

  useEffect(() => {
    void refresh();
    let lastVersion = -1;
    const source = new EventSource(`/api/s/${code}/events`);
    source.onmessage = (e) => {
      const v = Number(e.data);
      if (v !== lastVersion) {
        lastVersion = v;
        void refresh();
      }
    };
    const poll = setInterval(() => void refresh(), 15_000);
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      source.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, refresh]);

  /** Converts the server's clock to this device's clock. */
  const serverToLocal = useCallback((serverMs: number) => serverMs + clockOffset.current, []);

  return { state, error, refresh, serverToLocal };
}
