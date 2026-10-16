import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { adsEnabled } from "@/lib/ads/config";
import { CookieConsent } from "@/components/cookie-consent";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  ...(SITE.url ? { metadataBase: new URL(SITE.url) } : {}),
  title: { default: `${APP_NAME}: ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: "A calm habit and challenge tracker with a visual record of every day you showed up.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: "#F5F3ED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent adsEnabled={adsEnabled()} />
      </body>
    </html>
  );
}
