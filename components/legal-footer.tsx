import Link from "next/link";
import { Cookie, FileText, LifeBuoy, MessageSquarePlus, Settings2, Shield } from "lucide-react";
import { Brand } from "@/components/brand";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { APP_NAME } from "@/lib/brand";
import { SITE } from "@/lib/site";

const pill =
  "inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink-2 transition hover:border-line-strong hover:text-navy";
const col = "block rounded py-1.5 text-sm leading-5 text-ink-2 transition hover:text-navy hover:underline";

/**
 * Footer. `app` is a compact row of link pills inside the signed-in app;
 * `site` is the fuller footer for the landing, sign-in and policy pages.
 */
export function LegalFooter({ variant = "site", className = "" }: { variant?: "app" | "site"; className?: string }) {
  const year = new Date().getFullYear();

  if (variant === "app") {
    return (
      <footer className={`border-t border-line pt-6 ${className}`}>
        <nav aria-label="Legal and support" className="flex flex-wrap gap-2">
          <Link href="/privacy" className={pill}>
            <Shield size={15} aria-hidden="true" /> Privacy
          </Link>
          <Link href="/terms" className={pill}>
            <FileText size={15} aria-hidden="true" /> Terms
          </Link>
          <Link href="/cookies" className={pill}>
            <Cookie size={15} aria-hidden="true" /> Ads &amp; cookies
          </Link>
          <CookieSettingsButton className={pill}>
            <Settings2 size={15} aria-hidden="true" /> Cookie settings
          </CookieSettingsButton>
          <Link href="/support" className={pill}>
            <LifeBuoy size={15} aria-hidden="true" /> Support
          </Link>
          <Link href="/feedback" className={pill}>
            <MessageSquarePlus size={15} aria-hidden="true" /> Share feedback
          </Link>
        </nav>
        <p className="mt-4 text-sm text-ink-3">
          © {year} {APP_NAME}
        </p>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-line bg-white/70 ${className}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-9 px-5 py-12 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Brand href="/" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-ink-2">A calm place to build habits, run challenges, and keep proof that you showed up.</p>
          {SITE.supportEmail && (
            <a href={`mailto:${SITE.supportEmail}`} className="mt-3 inline-block text-sm font-semibold text-teal underline underline-offset-4">
              {SITE.supportEmail}
            </a>
          )}
        </div>

        <nav aria-label="Product">
          <h2 className="font-display text-sm font-semibold text-navy">Product</h2>
          <ul className="mt-2.5 space-y-0.5">
            <li><Link href="/#features" className={col}>Features</Link></li>
            <li><Link href="/#how" className={col}>How it works</Link></li>
            <li><Link href="/#updates" className={col}>What&apos;s new</Link></li>
            <li><Link href="/#faq" className={col}>FAQ</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="font-display text-sm font-semibold text-navy">Help</h2>
          <ul className="mt-2.5 space-y-0.5">
            <li><Link href="/support" className={col}>Support</Link></li>
            <li><Link href="/feedback" className={col}>Share feedback</Link></li>
            <li><Link href="/login" className={col}>Sign in</Link></li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="font-display text-sm font-semibold text-navy">Legal</h2>
          <ul className="mt-2.5 space-y-0.5">
            <li><Link href="/privacy" className={col}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={col}>Terms of Service</Link></li>
            <li><Link href="/cookies" className={col}>Ads &amp; cookies</Link></li>
            <li>
              <CookieSettingsButton className={`${col} text-left`} />
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-sm text-ink-3 sm:px-8">
          © {year} {APP_NAME}. Your habits stay private to you.
        </p>
      </div>
    </footer>
  );
}
