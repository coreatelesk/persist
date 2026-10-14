"use client";

import { useEffect, useRef, useState } from "react";
import type { AdsConfig } from "@/lib/ads/config";
import { mountAd, type AdStatus } from "./providers";

/**
 * The single banner slot. It loads after the page is idle, takes no space until an ad
 * actually fills (so nothing above it moves), and removes itself completely if the
 * provider is blocked, offline, or has nothing to show.
 */
export function AdSlot({ config }: { config: AdsConfig }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AdStatus>("loading");

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let cleanup: (() => void) | undefined;

    const start = () => {
      cleanup = mountAd(config, el, setStatus);
    };
    // Wait for the browser to be idle so ads never compete with the app itself.
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(start, { timeout: 3000 });
    else timeoutId = setTimeout(start, 1500);

    return () => {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timeoutId) clearTimeout(timeoutId);
      cleanup?.();
    };
  }, [config]);

  if (status === "failed") return null;

  const filled = status === "filled";
  return (
    <aside
      aria-label="Advertisement"
      data-ad-status={status}
      className={filled ? "mt-6 rounded-2xl border border-line bg-white p-3" : "h-0 overflow-hidden"}
    >
      {filled && <p className="mb-1.5 px-1 text-[11px] font-medium text-ink-3">Advertisement</p>}
      <div ref={container} className="min-h-0 w-full" />
    </aside>
  );
}
