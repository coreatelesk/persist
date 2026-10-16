"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Cookie, X } from "lucide-react";
import {
  CONSENT_CHANGED_EVENT,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  OPEN_COOKIE_SETTINGS_EVENT,
  parseConsent,
  type ConsentChoice,
} from "@/lib/consent";

const readCookie = (): ConsentChoice | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return parseConsent(match ? decodeURIComponent(match[1]) : null);
};
const subscribe = (cb: () => void) => {
  window.addEventListener(CONSENT_CHANGED_EVENT, cb);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, cb);
};

/** `undefined` on the server and during hydration, then the visitor's saved choice (or null). */
function useConsent() {
  return useSyncExternalStore<ConsentChoice | null | undefined>(subscribe, readCookie, () => undefined);
}

const APP_PATHS = /^\/(dashboard|habits|challenges|history|account|feedback)(\/|$)/;

/**
 * Cookie notice and preferences.
 * - The banner only appears when advertising is configured, because that is the only optional
 *   choice. Essential cookies (sign-in, time zone, this preference) don't need consent.
 * - Advertising is opt-in: nothing from the ad provider loads until the visitor accepts.
 */
export function CookieConsent({ adsEnabled }: { adsEnabled: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const consent = useConsent();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  function decide(choice: ConsentChoice) {
    document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax`;
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    dialog.current?.close();
    router.refresh();
  }

  const showBanner = adsEnabled && consent === null;
  const aboveNav = APP_PATHS.test(pathname);

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie notice"
          className={`fixed inset-x-3 z-40 rounded-2xl border border-line-strong bg-white p-4 shadow-lg md:inset-x-auto md:right-5 md:max-w-md ${
            aboveNav ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5" : "bottom-3 md:bottom-5"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-gold-tint text-gold-deep">
              <Cookie size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 text-sm leading-6 text-ink-2">
              <p className="font-semibold text-navy">Your cookie choices</p>
              <p className="mt-0.5">
                We always use essential cookies to keep you signed in. May we also load advertising, which can set its own cookies?{" "}
                <Link href="/cookies" className="font-semibold text-teal underline underline-offset-4">
                  Details
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button onClick={() => decide("ads")} className="min-h-10 flex-1 rounded-xl bg-moss px-4 text-sm font-semibold text-white hover:bg-moss-deep">
              Accept ads
            </button>
            <button onClick={() => decide("essential")} className="min-h-10 flex-1 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
              Essential only
            </button>
          </div>
        </div>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="cookie-dialog-title"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-line-strong bg-white p-0 text-ink backdrop:bg-navy/40"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="cookie-dialog-title" className="font-display text-xl font-semibold text-navy">
              Cookie preferences
            </h2>
            <button onClick={() => dialog.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-cream-deep">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-navy">Essential</p>
              <span className="rounded-full bg-moss-tint px-2.5 py-1 text-xs font-semibold text-moss-deep">Always on</span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">Keeps you signed in, remembers your time zone so &ldquo;today&rdquo; is right, and remembers this choice. The service can&apos;t work without them.</p>
          </div>

          {adsEnabled ? (
            <div className="mt-3 rounded-xl border border-line p-4">
              <p className="font-semibold text-navy">Advertising</p>
              <p className="mt-1.5 text-sm leading-6 text-ink-2">
                Shows one small banner ad on your Today page. The ad provider (Google AdSense) may use cookies to show and measure ads. Currently:{" "}
                <strong className="text-navy">{consent === "ads" ? "allowed" : "off"}</strong>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => decide("ads")} className="min-h-10 rounded-xl bg-moss px-4 text-sm font-semibold text-white hover:bg-moss-deep">
                  Allow advertising
                </button>
                <button onClick={() => decide("essential")} className="min-h-10 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
                  Essential only
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm leading-6 text-ink-2">
              That&apos;s all there is to choose: there are no advertising or tracking cookies to turn on or off.
            </p>
          )}

          <p className="mt-4 text-sm text-ink-2">
            Read more on the{" "}
            <Link href="/cookies" onClick={() => dialog.current?.close()} className="font-semibold text-teal underline underline-offset-4">
              Advertising and cookies page
            </Link>
            .
          </p>
        </div>
      </dialog>
    </>
  );
}
