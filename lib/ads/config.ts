/**
 * Ad configuration. Ads are OFF unless explicitly enabled AND fully, validly configured.
 *
 *   NEXT_PUBLIC_ADS_ENABLED=true
 *   NEXT_PUBLIC_ADS_PROVIDER=adsense
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-...   (your publisher ID)
 *   NEXT_PUBLIC_ADSENSE_SLOT=...            (your ad unit's slot ID)
 *
 * To add another provider later, extend `AdsConfig` here and add a loader in
 * components/ads/providers.ts. Nothing else in the app knows which provider is used.
 */
export type AdsConfig = { provider: "adsense"; client: string; slot: string };

export function getAdsConfig(): AdsConfig | null {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  const provider = (process.env.NEXT_PUBLIC_ADS_PROVIDER ?? "adsense").trim().toLowerCase();

  if (provider === "adsense") {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
    const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim() ?? "";
    if (/^ca-pub-\d{10,20}$/.test(client) && /^\d{6,20}$/.test(slot)) {
      return { provider: "adsense", client, slot };
    }
  }
  return null;
}

export function adsEnabled(): boolean {
  return getAdsConfig() !== null;
}
