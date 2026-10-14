import { APP_NAME } from "@/lib/brand";

/**
 * Deployment-specific public settings. All optional; see .env.example.
 * NEXT_PUBLIC_* values are read at build time, so redeploy after changing them.
 */
function clean(value: string | undefined) {
  const v = value?.trim();
  return v ? v : undefined;
}

const email = clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);

export const SITE = {
  name: APP_NAME,
  /** Public URL of the deployed app, no trailing slash. */
  url: clean(process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/+$/, ""),
  supportEmail: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
  /** Optional. Shown on policy pages only when set. Not invented. */
  operatorName: clean(process.env.NEXT_PUBLIC_OPERATOR_NAME),
  operatorAddress: clean(process.env.NEXT_PUBLIC_OPERATOR_ADDRESS),
};

/** Update this date whenever the policy text changes. */
export const POLICY_UPDATED = "13 October 2026";
