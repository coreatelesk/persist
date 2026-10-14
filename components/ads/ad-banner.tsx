import { getAdsConfig } from "@/lib/ads/config";
import { hasFeature, type Entitlements } from "@/lib/entitlements";
import { AdSlot } from "./ad-slot";

/**
 * Renders the one banner placement. Renders nothing when ads are disabled, not configured,
 * or the user's plan includes the ad-free feature. Used only on the user dashboard.
 */
export function AdBanner({ entitlements }: { entitlements: Entitlements }) {
  const config = getAdsConfig();
  if (!config || hasFeature(entitlements, "ad_free")) return null;
  return <AdSlot config={config} />;
}
