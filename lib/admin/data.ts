import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { addDays, canonicalTimeZone, isDateKey } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";

export type AdminOverview = {
  timezone: string;
  generated_at: string;
  users: { total: number; confirmed: number; new_today: number; new_7d: number; new_30d: number; never_active: number };
  activity: { dau: number; dau_yesterday: number; wau: number; mau: number };
  habits: { total: number; active: number; archived: number };
  challenges: { total: number; active: number; archived: number; finished: number };
  checkins: { total: number; today: number; last_7d: number; last_30d: number };
};

export type SeriesPoint = {
  bucket_start: string;
  signups: number;
  active_users: number;
  checkins: number;
  habits_created: number;
  challenges_created: number;
};

export type AdminUser = {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  status: "active" | "unconfirmed" | "suspended";
  active_habits: number;
  archived_habits: number;
  challenges: number;
  checkins: number;
  total_count: number;
};

export type RecentActivity = {
  event: string;
  created_at: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
};

type RpcError = { code?: string; message?: string } | null;

/** Admin RPCs refuse non-admins in the database; treat that as "no such page". */
function unwrap<T>(data: T | null, error: RpcError): T {
  if (error) {
    if (error.code === "42501" || (error.message ?? "").includes("forbidden")) notFound();
    throw new Error(friendlyDbError(error, "Couldn't load admin data."));
  }
  return data as T;
}

export async function loadOverview(supabase: SupabaseClient, timeZone: string) {
  const { data, error } = await supabase.rpc("admin_overview", { p_tz: canonicalTimeZone(timeZone) });
  return unwrap(data as AdminOverview | null, error);
}

export const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 months" },
] as const;
export const BUCKETS = ["day", "week", "month"] as const;
export type Bucket = (typeof BUCKETS)[number];

export function parseRange(params: { range?: string; bucket?: string }) {
  const range = RANGES.some((r) => String(r.value) === params.range) ? Number(params.range) : 30;
  const requested = BUCKETS.find((b) => b === params.bucket);
  const bucket: Bucket = requested ?? (range >= 365 ? "week" : "day");
  return { range, bucket };
}

export async function loadSeries(supabase: SupabaseClient, today: string, range: number, bucket: Bucket, timeZone: string) {
  const from = addDays(today, -(range - 1));
  if (!isDateKey(from)) throw new Error("Invalid range");
  const { data, error } = await supabase.rpc("admin_timeseries", { p_from: from, p_to: today, p_bucket: bucket, p_tz: canonicalTimeZone(timeZone) });
  return unwrap((data as SeriesPoint[] | null) ?? [], error);
}

export const USER_SORTS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "active_desc", label: "Recently active" },
  { value: "email_asc", label: "Email A–Z" },
] as const;

export const PAGE_SIZE = 25;

export async function loadUsers(supabase: SupabaseClient, params: { q?: string; sort?: string; page?: number }) {
  const sort = USER_SORTS.find((s) => s.value === params.sort)?.value ?? "created_desc";
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const { data, error } = await supabase.rpc("admin_users", {
    p_search: params.q?.slice(0, 100) || null,
    p_sort: sort,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  const rows = unwrap((data as AdminUser[] | null) ?? [], error);
  return { rows, total: rows[0] ? Number(rows[0].total_count) : 0, sort, page };
}

export async function loadRecentActivity(supabase: SupabaseClient, limit = 15) {
  const { data, error } = await supabase.rpc("admin_recent_activity", { p_limit: limit });
  return unwrap((data as RecentActivity[] | null) ?? [], error);
}

const EVENT_LABELS: Record<string, string> = {
  habit_created: "Created a habit",
  habit_updated: "Edited a habit",
  habit_archived: "Archived a habit",
  habit_restored: "Restored a habit",
  challenge_created: "Started a challenge",
  challenge_completed: "Completed a challenge",
  challenge_ended: "Ended a challenge",
  challenge_archived: "Archived a challenge",
  challenge_restored: "Restored a challenge",
  challenge_updated: "Updated a challenge",
  checkin: "Completed a check-in",
};

export function eventLabel(event: string) {
  return EVENT_LABELS[event] ?? event.replace(/_/g, " ");
}

/** Label for a bucket start date on a chart axis. */
export function bucketLabel(date: string, bucket: Bucket) {
  if (bucket === "month") return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Never";
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

