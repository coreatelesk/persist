/** Safe for both server and client code. Wording shared by every place a limit is explained. */
export type LimitKind = "active_habits" | "archived_habits" | "active_challenges" | "archived_challenges";

export const LIMIT_KINDS: LimitKind[] = ["active_habits", "archived_habits", "active_challenges", "archived_challenges"];

export function isLimitKind(value: string): value is LimitKind {
  return (LIMIT_KINDS as string[]).includes(value);
}

/** The message shown when the database refuses an action because a limit is reached. */
export function limitReachedMessage(kind: LimitKind, cap: number | string): string {
  switch (kind) {
    case "active_habits":
      return `You've reached the limit of ${cap} active habits. Archive or delete a habit you no longer need, then try again.`;
    case "archived_habits":
      return `Your archive is full (${cap} archived habits). Delete an archived habit you no longer need, or restore one, before archiving another.`;
    case "active_challenges":
      return `You've reached the limit of ${cap} active challenges. Finish, archive, or delete a challenge to make room.`;
    case "archived_challenges":
      return `Your archive is full (${cap} archived challenges). Delete an archived challenge you no longer need, or restore one, before archiving another.`;
  }
}
