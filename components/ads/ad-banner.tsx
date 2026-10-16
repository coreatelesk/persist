import { getAdsConfig } from "@/lib/ads/config";
import { getConsent } from "@/lib/consent-server";
import { hasFeature, type Entitlements } from "@/lib/entitlements";
import { AdSlot } from "./ad-slot";

/**
 * Renders the one banner placement. Renders nothing when ads are disabled, not configured,
 * the user's plan includes the ad-free feature, or the visitor has not allowed advertising cookies. Used only on the user dashboard.
 */
export async function AdBanner({ entitlements }: { entitlements: Entitlements }) {
  const config = getAdsConfig();
  if (!config || hasFeature(entitlements, "ad_free")) return null;
  // Advertising is opt-in: nothing loads until the visitor has chosen to allow it.
  if ((await getConsent()) !== "ads") return null;
  return <AdSlot config={config} />;
}
