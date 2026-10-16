/**
 * Cookie preferences. Essential cookies (sign-in session, time zone, and this preference itself)
 * need no consent. The only optional category is advertising, and only when ads are configured.
 * Advertising is OPT-IN: no ad code is loaded until the visitor chooses "ads".
 */
export const CONSENT_COOKIE = "persist-consent";
export const CONSENT_CHANGED_EVENT = "persist:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "persist:open-cookie-settings";
/** About six months. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type ConsentChoice = "ads" | "essential";

export function parseConsent(value: string | null | undefined): ConsentChoice | null {
  return value === "ads" || value === "essential" ? value : null;
}
