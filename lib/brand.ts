/**
 * Product name and tagline. Change them with environment variables (no code edits):
 *   NEXT_PUBLIC_APP_NAME="Persist"
 *   NEXT_PUBLIC_APP_TAGLINE="Show up. Leave proof."
 * NEXT_PUBLIC_* values are read at build time, so rebuild/redeploy after changing them.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Persist";
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() || "Show up. Leave proof.";

/** Splits a tagline into sentences so the hero can stack them. */
export function taglineLines(tagline: string = APP_TAGLINE): string[] {
  return tagline.split(/(?<=[.!?])\s+/).filter(Boolean);
}
