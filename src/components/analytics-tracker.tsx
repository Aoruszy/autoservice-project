"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "avtoslot.analytics.session";

function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getSessionId();
    if (!pathname || !sessionId) {
      return;
    }

    const payload = JSON.stringify({
      type: "page_view",
      path: pathname,
      sessionId,
      referrer: document.referrer || undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
