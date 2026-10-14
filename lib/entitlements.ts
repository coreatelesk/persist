import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LimitKind } from "@/lib/limit-messages";

/**
 * Entitlements: what a user's plan allows.
 *
 * The database is the source of truth and enforces every limit (see migration 004).
 * This module reads the same numbers so the UI can explain them. Plans live in the
 * `plans` table; a user is on "free" unless a row in `user_plans` says otherwise.
 * A `null` limit means unlimited. Feature flags live in the plan's `features` object.
 */
export type FeatureFlag = "ad_free" | "reminders";

export type Entitlements = {
  plan: string;
  planName: string;
  limits: Record<LimitKind, number | null>;
  usage: Record<LimitKind, number>;
  features: Partial<Record<FeatureFlag, boolean>>;
};

/** Shown only if the database can't be read. The database still enforces the real limits. */
export const FREE_DEFAULTS: Entitlements = {
  plan: "free",
  planName: "Free",
  limits: { active_habits: 10, active_challenges: 10, archived_habits: 20, archived_challenges: 20 },
  usage: { active_habits: 0, active_challenges: 0, archived_habits: 0, archived_challenges: 0 },
  features: { ad_free: false, reminders: false },
};

type Raw = {
  plan?: string;
  plan_name?: string;
  limits?: Partial<Record<LimitKind, number | null>>;
  usage?: Partial<Record<LimitKind, number>>;
  features?: Record<string, unknown>;
};

export async function getEntitlements(supabase: SupabaseClient): Promise<Entitlements> {
  const { data, error } = await supabase.rpc("my_limits");
  if (error || !data) return FREE_DEFAULTS;
  const raw = data as Raw;
  const pick = (kind: LimitKind) => (raw.limits && kind in raw.limits ? (raw.limits[kind] ?? null) : FREE_DEFAULTS.limits[kind]);
  return {
    plan: raw.plan ?? "free",
    planName: raw.plan_name ?? "Free",
    limits: {
      active_habits: pick("active_habits"),
      active_challenges: pick("active_challenges"),
      archived_habits: pick("archived_habits"),
      archived_challenges: pick("archived_challenges"),
    },
    usage: {
      active_habits: Number(raw.usage?.active_habits ?? 0),
      active_challenges: Number(raw.usage?.active_challenges ?? 0),
      archived_habits: Number(raw.usage?.archived_habits ?? 0),
      archived_challenges: Number(raw.usage?.archived_challenges ?? 0),
    },
    features: Object.fromEntries(Object.entries(raw.features ?? {}).map(([k, v]) => [k, v === true])),
  };
}

export function hasFeature(entitlements: Entitlements, flag: FeatureFlag): boolean {
  return entitlements.features[flag] === true;
}

/** True when the user can add one more item to this category. */
export function hasRoom(entitlements: Entitlements, kind: LimitKind): boolean {
  const cap = entitlements.limits[kind];
  return cap === null || entitlements.usage[kind] < cap;
}
