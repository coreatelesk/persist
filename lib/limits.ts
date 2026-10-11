import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, formatKey } from "@/lib/dates";

export type Usage = {
  habits: { used: number; limit: number };
  challenges: { used: number; limit: number };
  /** Human-friendly date the allowance resets, e.g. "1 Nov". */
  resetsOn: string;
};

const DEFAULTS = { habits_per_month: 20, challenges_per_month: 10 };

/**
 * Reads this month's allowance. The database enforces the real limit, so if anything
 * here fails we fall back to defaults instead of blocking the page.
 */
export async function loadUsage(supabase: SupabaseClient): Promise<Usage> {
  const month = new Date().toISOString().slice(0, 7); // counters use UTC months
  const [limitsRes, counterRes] = await Promise.all([
    supabase.from("app_limits").select("key,value"),
    supabase.from("usage_counters").select("habits_created,challenges_created").eq("month", month).maybeSingle(),
  ]);
  const limits = new Map((limitsRes.data ?? []).map((r) => [r.key as string, r.value as number]));
  return {
    habits: {
      used: counterRes.data?.habits_created ?? 0,
      limit: limits.get("habits_per_month") ?? DEFAULTS.habits_per_month,
    },
    challenges: {
      used: counterRes.data?.challenges_created ?? 0,
      limit: limits.get("challenges_per_month") ?? DEFAULTS.challenges_per_month,
    },
    resetsOn: formatKey(`${addMonths(month, 1)}-01`, "short"),
  };
}
