"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

/** Opens the cookie preferences dialog from anywhere (footer, policy page). */
export function CookieSettingsButton({ className = "", children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))} className={className}>
      {children}
    </button>
  );
}
