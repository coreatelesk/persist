export type HabitSchedule =
  | { kind: "daily" }
  | { kind: "weekdays" }
  | { kind: "custom"; days: number[] }
  | { kind: "weekly_target"; target: number };

export type Habit = {
  id: string;
  title: string;
  description: string | null;
  schedule: HabitSchedule;
  created_at: string;
  archived_at: string | null;
};

export type ChallengeStatus = "active" | "completed" | "ended" | "archived";

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  starts_on: string;
  ends_on: string;
  target_days: number;
  status: ChallengeStatus;
  completed_at: string | null;
  created_at: string;
};
