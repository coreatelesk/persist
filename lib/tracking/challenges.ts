import { diffDays } from "@/lib/dates";
import type { Challenge } from "./types";

export type ChallengePhase = "upcoming" | "active" | "completed" | "ended" | "archived";

export type ChallengeView = Challenge & {
  done: number;
  phase: ChallengePhase;
  totalDays: number;
  /** 1-based day of the challenge, clamped to [0, totalDays]. */
  dayNumber: number;
  daysLeft: number;
  remainingNeeded: number;
  pct: number;
  /** True when the goal can no longer be reached in the days that remain. */
  atRisk: boolean;
};

export function describeChallenge(challenge: Challenge, done: number, today: string): ChallengeView {
  const totalDays = diffDays(challenge.starts_on, challenge.ends_on) + 1;
  const target = Math.min(challenge.target_days, totalDays);
  const reached = done >= target;

  let phase: ChallengePhase;
  if (challenge.status === "archived") phase = "archived";
  else if (reached) phase = "completed";
  else if (challenge.status === "ended" || today > challenge.ends_on) phase = "ended";
  else if (today < challenge.starts_on) phase = "upcoming";
  else phase = "active";

  const dayNumber = Math.max(0, Math.min(totalDays, diffDays(challenge.starts_on, today) + 1));
  const daysLeft = Math.max(0, diffDays(today, challenge.ends_on) + 1);
  const remainingNeeded = Math.max(0, target - done);

  return {
    ...challenge,
    target_days: target,
    done,
    phase,
    totalDays,
    dayNumber,
    daysLeft,
    remainingNeeded,
    pct: Math.min(100, Math.round((done / target) * 100)),
    atRisk: phase === "active" && remainingNeeded > daysLeft,
  };
}
