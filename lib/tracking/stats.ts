import { addDays, diffDays, startOfWeek } from "@/lib/dates";
import { isDueOn, isFixedSchedule } from "./schedule";
import type { HabitSchedule } from "./types";

export type HabitLite = {
  id: string;
  schedule: HabitSchedule;
  /** First day the habit existed, in the user's time zone. */
  startKey: string;
  /** Day the habit was archived (exclusive), if any. */
  endKey: string | null;
};

export type ChallengeLite = { id: string; starts_on: string; ends_on: string; status: string };

/** -1 = nothing scheduled, 0 = scheduled but nothing done, 1–4 = share of items done. */
export type Level = -1 | 0 | 1 | 2 | 3 | 4;

export type DayCell = { date: string; done: number; total: number; level: Level };

export const doneKey = (id: string, date: string) => `${id}|${date}`;

function levelFor(done: number, total: number): Level {
  if (total === 0) return -1;
  if (done === 0) return 0;
  const ratio = done / total;
  if (ratio <= 0.34) return 1;
  if (ratio <= 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
}

/**
 * One cell per day between `from` and `to` (inclusive).
 * An item counts toward a day if it was scheduled that day or was completed that day.
 * Flexible (weekly-target) habits only count on days they were completed.
 */
export function buildDays(input: {
  from: string;
  to: string;
  habits: HabitLite[];
  challenges: ChallengeLite[];
  habitDone: Set<string>;
  challengeDone: Set<string>;
}): DayCell[] {
  const { from, to, habits, challenges, habitDone, challengeDone } = input;
  const count = diffDays(from, to) + 1;
  const cells: DayCell[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(from, i);
    let done = 0;
    let total = 0;
    for (const habit of habits) {
      const completed = habitDone.has(doneKey(habit.id, date));
      const existed = date >= habit.startKey && (habit.endKey === null || date < habit.endKey);
      if (!existed && !completed) continue;
      const due = existed && isFixedSchedule(habit.schedule) && isDueOn(habit.schedule, date);
      if (due || completed) total += 1;
      if (completed) done += 1;
    }
    for (const challenge of challenges) {
      const completed = challengeDone.has(doneKey(challenge.id, date));
      const inRange = date >= challenge.starts_on && date <= challenge.ends_on && challenge.status !== "archived";
      if (inRange || completed) total += 1;
      if (completed) done += 1;
    }
    cells.push({ date, done, total, level: levelFor(done, total) });
  }
  return cells;
}

/** Consecutive days with at least one check-in. Today is forgiven until the day ends. */
export function currentStreak(days: DayCell[], today: string): number {
  const byDate = new Map(days.map((d) => [d.date, d]));
  let cursor = byDate.get(today)?.done ? today : addDays(today, -1);
  let streak = 0;
  while ((byDate.get(cursor)?.done ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(days: DayCell[]): number {
  let best = 0;
  let run = 0;
  for (const day of days) {
    run = day.done > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Share of scheduled check-ins completed over the last `n` days (null if nothing was scheduled). */
export function completionRate(days: DayCell[], n: number): number | null {
  const slice = days.slice(-n);
  const total = slice.reduce((sum, d) => sum + d.total, 0);
  if (total === 0) return null;
  const done = slice.reduce((sum, d) => sum + Math.min(d.done, d.total), 0);
  return Math.round((done / total) * 100);
}

export type HabitStreak = { count: number; unit: "day" | "week" };

/**
 * Streak for one habit. Fixed schedules count consecutive scheduled days (rest days are skipped);
 * weekly-target habits count consecutive weeks that met the target.
 */
export function habitStreak(habit: HabitLite, done: Set<string>, today: string): HabitStreak {
  const has = (date: string) => done.has(doneKey(habit.id, date));
  const horizon = 400;

  if (habit.schedule.kind === "weekly_target") {
    const { target } = habit.schedule;
    const weekDone = (weekStart: string) => {
      let n = 0;
      for (let i = 0; i < 7; i++) if (has(addDays(weekStart, i))) n += 1;
      return n;
    };
    let week = startOfWeek(today);
    let count = 0;
    // The current week is forgiven until it ends.
    if (weekDone(week) >= target) count += 1;
    week = addDays(week, -7);
    for (let i = 0; i < 60 && weekDone(week) >= target; i++) {
      count += 1;
      week = addDays(week, -7);
    }
    return { count, unit: "week" };
  }

  let count = 0;
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, -i);
    if (date < habit.startKey) break;
    if (!isDueOn(habit.schedule, date)) continue;
    if (has(date)) count += 1;
    else if (i === 0) continue; // today still open
    else break;
  }
  return { count, unit: "day" };
}

/** How many times a weekly-target habit was done in the week containing `today`. */
export function weekCount(habitId: string, done: Set<string>, today: string): number {
  const start = startOfWeek(today);
  let n = 0;
  for (let i = 0; i < 7; i++) if (done.has(doneKey(habitId, addDays(start, i)))) n += 1;
  return n;
}

/** Per-habit completion rate over the last `n` days, as a whole percent (null when nothing was due). */
export function habitRate(habit: HabitLite, done: Set<string>, today: string, n = 30): number | null {
  const from = addDays(today, -(n - 1));
  let due = 0;
  let hit = 0;
  for (let i = 0; i < n; i++) {
    const date = addDays(from, i);
    if (date < habit.startKey) continue;
    if (!isFixedSchedule(habit.schedule)) {
      if (done.has(doneKey(habit.id, date))) hit += 1;
      continue;
    }
    if (!isDueOn(habit.schedule, date)) continue;
    due += 1;
    if (done.has(doneKey(habit.id, date))) hit += 1;
  }
  if (habit.schedule.kind === "weekly_target") {
    const activeDays = Math.max(1, Math.min(n, diffDays(habit.startKey, today) + 1));
    const expected = (habit.schedule.target * activeDays) / 7;
    return Math.min(100, Math.round((hit / Math.max(expected, 1)) * 100));
  }
  return due === 0 ? null : Math.round((hit / due) * 100);
}
