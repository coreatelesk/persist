import { z } from "zod";
import { isDateKey } from "@/lib/dates";

const text = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer.`);

export const habitSchema = z
  .object({
    title: z.string().trim().min(1, "Give your habit a name.").max(80, "Use 80 characters or fewer."),
    description: text(240).optional().default(""),
    kind: z.enum(["daily", "weekdays", "custom", "weekly_target"]),
    days: z.array(z.number().int().min(0).max(6)).default([]),
    target: z.number().int().min(1).max(7).default(3),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "custom" && value.days.length === 0) {
      ctx.addIssue({ code: "custom", path: ["days"], message: "Pick at least one day." });
    }
  });

export type HabitInput = z.infer<typeof habitSchema>;

export const challengeSchema = z
  .object({
    title: z.string().trim().min(1, "Give your challenge a name.").max(100, "Use 100 characters or fewer."),
    description: text(500).optional().default(""),
    startsOn: z.string().refine(isDateKey, "Choose a valid start date."),
    durationDays: z.number().int("Use whole days.").min(1, "Run it for at least 1 day.").max(365, "Challenges can run up to 365 days."),
    targetDays: z.number().int("Use whole days.").min(1, "Aim for at least 1 day."),
  })
  .superRefine((value, ctx) => {
    if (value.targetDays > value.durationDays) {
      ctx.addIssue({ code: "custom", path: ["targetDays"], message: "The goal can't be longer than the challenge." });
    }
  });

export type ChallengeInput = z.infer<typeof challengeSchema>;

export const checkinSchema = z.object({
  kind: z.enum(["habit", "challenge"]),
  id: z.uuid(),
  date: z.string().refine(isDateKey, "Invalid date."),
  done: z.boolean(),
});

export const idSchema = z.uuid();

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
