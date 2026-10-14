"use client";

import type { AdsConfig } from "@/lib/ads/config";

export type AdStatus = "loading" | "filled" | "failed";

/**
 * One loader per provider. Each takes the container and reports status through `report`.
 * It must never throw: any failure is reported as "failed" and the slot disappears.
 * Add a new provider by adding a case here and a branch in lib/ads/config.ts.
 */
export function mountAd(config: AdsConfig, container: HTMLElement, report: (status: AdStatus) => void): () => void {
  switch (config.provider) {
    case "adsense":
      return mountAdsense(config, container, report);
  }
}

const SCRIPT_ATTR = "data-persist-ads";

function mountAdsense(config: AdsConfig, container: HTMLElement, report: (s: AdStatus) => void): () => void {
  let cancelled = false;
  let observer: MutationObserver | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const fail = () => {
    if (!cancelled) report("failed");
  };

  try {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.style.width = "100%";
    ins.setAttribute("data-ad-client", config.client);
    ins.setAttribute("data-ad-slot", config.slot);
    ins.setAttribute("data-ad-format", "horizontal");
    ins.setAttribute("data-full-width-responsive", "true");
    container.appendChild(ins);

    observer = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "filled" && !cancelled) report("filled");
      if (status === "unfilled") fail();
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    // Nothing filled within 10s counts as a failure, so the slot never lingers empty.
    timer = setTimeout(() => {
      if (ins.getAttribute("data-ad-status") !== "filled") fail();
    }, 10_000);

    const push = () => {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        (w.adsbygoogle = w.adsbygoogle ?? []).push({});
      } catch {
        fail();
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`);
    if (existing) {
      if (existing.dataset.state === "failed") fail();
      else push();
      existing.addEventListener("error", fail);
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute(SCRIPT_ATTR, "adsense");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.client)}`;
      script.onload = push;
      script.onerror = () => {
        script.dataset.state = "failed";
        fail();
      };
      document.head.appendChild(script);
    }
  } catch {
    fail();
  }

  return () => {
    cancelled = true;
    observer?.disconnect();
    if (timer) clearTimeout(timer);
    container.replaceChildren();
  };
}
