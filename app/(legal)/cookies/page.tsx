import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { ContactLine, LegalPage, Section } from "@/components/legal/prose";
import { getAdsConfig } from "@/lib/ads/config";
import { APP_NAME } from "@/lib/brand";
import { CONSENT_COOKIE } from "@/lib/consent";
import { TZ_COOKIE } from "@/lib/tz-constants";

export const metadata: Metadata = { title: "Advertising and Cookies" };

export default function CookiesPage() {
  const ads = getAdsConfig();
  return (
    <LegalPage
      title="Advertising and Cookie Disclosure"
      intro={`This page explains the cookies ${APP_NAME} sets and how advertising works. It describes what is configured on this deployment right now.`}
    >
      <Section title="Cookies we set">
        <ul>
          <li>
            <strong>Sign-in session cookies</strong> (names start with <code>sb-</code> and end with <code>-auth-token</code>): keep you signed in. They are essential, so the service can&apos;t work without them. They are set by our authentication provider, Supabase, through this app.
          </li>
          <li>
            <strong>Time zone cookie</strong> (<code>{TZ_COOKIE}</code>): remembers your time zone so &ldquo;today&rdquo; is correct for you. Stored for up to one year.
          </li>
          <li>
            <strong>Cookie choice</strong> (<code>{CONSENT_COOKIE}</code>): remembers whether you allowed advertising. Stored for about six months.
          </li>
        </ul>
        <p>We don&apos;t use third-party analytics or tracking cookies, and we don&apos;t use cookies to build advertising profiles ourselves.</p>
      </Section>

      <Section title="Advertising">
        {ads ? (
          <>
            <p>
              {APP_NAME} shows a single banner ad on the signed-in dashboard. It is served by <strong>Google AdSense</strong>. Ads are never shown on the owner dashboard or on the account, policy, or sign-in pages.
            </p>
            <p>
              To show and measure ads, Google and its partners may use cookies or similar technologies on your device and may collect information such as your IP address and the page you are viewing. Depending on your location and settings, ads may be personalised. This is controlled by Google, not by {APP_NAME}. See{" "}
              <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer" target="_blank">
                how Google uses information from sites that use its services
              </a>{" "}
              and manage your choices at{" "}
              <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
                Google Ad Settings
              </a>
              .
            </p>
            <p>
              <strong>Advertising is opt-in.</strong> No advertising code is loaded, and no advertising cookies are set, until you choose &ldquo;Accept ads&rdquo; in the cookie notice. You can change your mind at any time with Cookie settings. Withdrawing your choice stops ads loading from then on; cookies already set on your device can be removed in your browser settings.
            </p>
          </>
        ) : (
          <p>Ads are not currently shown in {APP_NAME}, and no advertising cookies are set. If that changes, this page will be updated first.</p>
        )}
      </Section>

      <Section title="Your choices">
        <p>
          <CookieSettingsButton className="inline-flex min-h-11 items-center rounded-xl border border-line-strong bg-white px-5 text-sm font-semibold text-navy hover:bg-cream-deep">
            Open cookie settings
          </CookieSettingsButton>
        </p>
        <ul>
          <li>You can block or delete cookies in your browser settings. If you block the essential cookies above, you won&apos;t be able to stay signed in.</li>
          <li>See the <Link href="/privacy">Privacy Policy</Link> for how we handle your information.</li>
        </ul>
      </Section>

      <Section title="Contact">
        <ContactLine />
      </Section>
    </LegalPage>
  );
}
