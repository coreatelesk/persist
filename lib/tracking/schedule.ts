import { weekday } from "@/lib/dates";
import type { HabitSchedule } from "./types";

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Habits with a fixed weekly pattern are "due" on specific days. Weekly-target habits are flexible. */
export function isFixedSchedule(schedule: HabitSchedule) {
  return schedule.kind !== "weekly_target";
}

export function isDueOn(schedule: HabitSchedule, key: string): boolean {
  const day = weekday(key);
  switch (schedule.kind) {
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "custom":
      return schedule.days.includes(day);
    case "weekly_target":
      // Flexible: any day is a good day to check in.
      return true;
  }
}

export function scheduleLabel(schedule: HabitSchedule): string {
  switch (schedule.kind) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekly_target":
      return `${schedule.target}× a week`;
    case "custom": {
      const order = [1, 2, 3, 4, 5, 6, 0];
      const days = order.filter((d) => schedule.days.includes(d)).map((d) => SHORT[d]);
      return days.join(", ") || "Custom days";
    }
  }
}

/** Parses whatever is stored in the jsonb column into a safe schedule. */
export function normalizeSchedule(raw: unknown): HabitSchedule {
  if (raw && typeof raw === "object") {
    const value = raw as Record<string, unknown>;
    if (value.kind === "weekdays") return { kind: "weekdays" };
    if (value.kind === "custom" && Array.isArray(value.days)) {
      const days = value.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6);
      if (days.length) return { kind: "custom", days };
    }
    if (value.kind === "weekly_target") {
      const target = Number(value.target);
      if (Number.isInteger(target) && target >= 1 && target <= 7) return { kind: "weekly_target", target };
    }
  }
  return { kind: "daily" };
}
