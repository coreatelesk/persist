import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, keyInZone } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";
import { buildDays, doneKey, type ChallengeLite, type HabitLite } from "./stats";
import { normalizeSchedule } from "./schedule";
import type { Challenge, Habit } from "./types";

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;

/** PostgREST returns at most 1,000 rows per request, so page through larger sets. */
async function fetchAll<T>(build: (from: number, to: number) => Page<T>): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let page = 0; page < 30; page++) {
    const { data, error } = await build(page * size, page * size + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return rows;
}

export type Tracking = {
  habits: Habit[];
  activeHabits: Habit[];
  challenges: Challenge[];
  habitLite: HabitLite[];
  challengeLite: ChallengeLite[];
  habitDone: Set<string>;
  challengeDone: Set<string>;
  /** Check-in counts per challenge. */
  challengeCounts: Map<string, number>;
  windowStart: string;
  days: ReturnType<typeof buildDays>;
};

export type TrackingResult = ({ ok: true } & Tracking) | { ok: false; error: string };

export async function loadTracking(
  supabase: SupabaseClient,
  today: string,
  timeZone: string,
  windowDays = 365,
): Promise<TrackingResult> {
  const windowStart = addDays(today, -(windowDays - 1));
  try {
    const [habitRes, challengeRes, habitDoneRows, challengeDoneRows] = await Promise.all([
      supabase
        .from("habits")
        .select("id,title,description,schedule,created_at,archived_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("challenges")
        .select("id,title,description,starts_on,ends_on,target_days,status,completed_at,created_at")
        .order("created_at", { ascending: false }),
      fetchAll<{ habit_id: string; completed_on: string }>((from, to) =>
        supabase
          .from("habit_completions")
          .select("habit_id,completed_on")
          .gte("completed_on", windowStart)
          .order("completed_on", { ascending: false })
          .order("id")
          .range(from, to),
      ),
      fetchAll<{ challenge_id: string; completed_on: string }>((from, to) =>
        supabase
          .from("challenge_completions")
          .select("challenge_id,completed_on")
          .order("completed_on", { ascending: false })
          .order("id")
          .range(from, to),
      ),
    ]);
    if (habitRes.error) throw habitRes.error;
    if (challengeRes.error) throw challengeRes.error;

    const habits: Habit[] = (habitRes.data ?? []).map((h) => ({
      ...h,
      schedule: normalizeSchedule(h.schedule),
    }));
    const challenges = (challengeRes.data ?? []) as Challenge[];

    const habitDone = new Set(habitDoneRows.map((r) => doneKey(r.habit_id, r.completed_on)));
    const challengeDone = new Set(challengeDoneRows.map((r) => doneKey(r.challenge_id, r.completed_on)));
    const challengeCounts = new Map<string, number>();
    for (const row of challengeDoneRows) {
      challengeCounts.set(row.challenge_id, (challengeCounts.get(row.challenge_id) ?? 0) + 1);
    }

    const habitLite: HabitLite[] = habits.map((h) => ({
      id: h.id,
      schedule: h.schedule,
      startKey: keyInZone(h.created_at, timeZone),
      endKey: h.archived_at ? keyInZone(h.archived_at, timeZone) : null,
    }));
    const challengeLite: ChallengeLite[] = challenges.map((c) => ({
      id: c.id,
      starts_on: c.starts_on,
      ends_on: c.ends_on,
      status: c.status,
    }));

    return {
      ok: true,
      habits,
      activeHabits: habits.filter((h) => !h.archived_at),
      challenges,
      habitLite,
      challengeLite,
      habitDone,
      challengeDone,
      challengeCounts,
      windowStart,
      days: buildDays({
        from: windowStart,
        to: today,
        habits: habitLite,
        challenges: challengeLite,
        habitDone,
        challengeDone,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      error: friendlyDbError(error as { code?: string; message?: string }, "We couldn't load your data. Please refresh."),
    };
  }
}
