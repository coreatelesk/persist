import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { describeChallenge } from "@/lib/tracking/challenges";
import { buildDays, bestStreak, completionRate, currentStreak, doneKey, habitStreak, weekCount, type HabitLite } from "@/lib/tracking/stats";

const TODAY = "2026-10-10"; // Saturday

const daily: HabitLite = { id: "a", schedule: { kind: "daily" }, startKey: "2026-09-01", endKey: null };
const weekdays: HabitLite = { id: "b", schedule: { kind: "weekdays" }, startKey: "2026-09-01", endKey: null };
const weekly: HabitLite = { id: "c", schedule: { kind: "weekly_target", target: 2 }, startKey: "2026-09-01", endKey: null };

const doneSet = (id: string, dates: string[]) => new Set(dates.map((d) => doneKey(id, d)));

describe("habit streaks", () => {
  it("counts consecutive days and forgives an open today", () => {
    const done = doneSet("a", ["2026-10-07", "2026-10-08", "2026-10-09"]);
    expect(habitStreak(daily, done, TODAY)).toEqual({ count: 3, unit: "day" });
    done.add(doneKey("a", TODAY));
    expect(habitStreak(daily, done, TODAY).count).toBe(4);
  });

  it("breaks on a missed scheduled day", () => {
    const done = doneSet("a", ["2026-10-06", "2026-10-08", "2026-10-09"]);
    expect(habitStreak(daily, done, TODAY).count).toBe(2);
  });

  it("skips rest days for weekday habits", () => {
    // Fri 9th, Thu 8th done; Sat today and Sun are rest days. Prior Fri 2nd also done, Mon-Wed missed.
    const done = doneSet("b", ["2026-10-09", "2026-10-08", "2026-10-07", "2026-10-06", "2026-10-05", "2026-10-02"]);
    expect(habitStreak(weekdays, done, TODAY).count).toBe(6);
  });

  it("counts weeks that met a weekly target", () => {
    const done = doneSet("c", ["2026-10-05", "2026-10-07", "2026-09-29", "2026-09-30"]);
    expect(habitStreak(weekly, done, TODAY)).toEqual({ count: 2, unit: "week" });
    expect(weekCount("c", done, TODAY)).toBe(2);
  });
});

describe("day cells and overall stats", () => {
  const habits = [daily, weekdays];
  const from = "2026-10-04";
  const habitDone = new Set([...doneSet("a", ["2026-10-08", "2026-10-09", "2026-10-10"]), ...doneSet("b", ["2026-10-09"])]);
  const days = buildDays({ from, to: TODAY, habits, challenges: [], habitDone, challengeDone: new Set() });

  it("builds one cell per day with the right share done", () => {
    expect(days).toHaveLength(7);
    const fri = days.find((d) => d.date === "2026-10-09")!;
    expect(fri).toMatchObject({ done: 2, total: 2, level: 4 });
    const thu = days.find((d) => d.date === "2026-10-08")!;
    expect(thu).toMatchObject({ done: 1, total: 2 });
    const sat = days.find((d) => d.date === TODAY)!;
    expect(sat.total).toBe(1); // weekday habit is a rest day
  });

  it("computes streaks and rates", () => {
    expect(currentStreak(days, TODAY)).toBe(3);
    expect(bestStreak(days)).toBe(3);
    expect(completionRate(days, 7)).toBeGreaterThan(0);
  });

  it("does not count days before a habit existed", () => {
    const late: HabitLite = { ...daily, startKey: "2026-10-09" };
    const cells = buildDays({ from, to: TODAY, habits: [late], challenges: [], habitDone: new Set(), challengeDone: new Set() });
    expect(cells.find((d) => d.date === "2026-10-05")!.level).toBe(-1);
    expect(cells.find((d) => d.date === "2026-10-09")!.level).toBe(0);
  });
});

describe("challenges", () => {
  const base = {
    id: "x",
    title: "30 days",
    description: null,
    starts_on: "2026-10-01",
    ends_on: "2026-10-30",
    target_days: 25,
    status: "active" as const,
    completed_at: null,
    created_at: "2026-10-01T00:00:00Z",
  };

  it("reports progress for an active challenge", () => {
    const v = describeChallenge(base, 8, TODAY);
    expect(v).toMatchObject({ phase: "active", totalDays: 30, dayNumber: 10, daysLeft: 21, remainingNeeded: 17, pct: 32, atRisk: false });
  });

  it("flags a challenge that can no longer be finished", () => {
    const v = describeChallenge(base, 2, "2026-10-28");
    expect(v.atRisk).toBe(true);
  });

  it("derives completed and ended phases", () => {
    expect(describeChallenge(base, 25, TODAY).phase).toBe("completed");
    expect(describeChallenge(base, 10, addDays(base.ends_on, 1)).phase).toBe("ended");
    expect(describeChallenge({ ...base, starts_on: "2026-10-20", ends_on: "2026-11-18" }, 0, TODAY).phase).toBe("upcoming");
  });
});
