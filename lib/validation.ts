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

export const FEEDBACK_CATEGORIES = ["feature", "improvement", "bug", "other"] as const;
export const FEEDBACK_STATUSES = ["new", "reviewing", "planned", "done", "declined"] as const;

export const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, "Choose what kind of feedback this is."),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(2000, "Please keep it under 2,000 characters."),
});

export const feedbackUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(FEEDBACK_STATUSES),
  note: z.string().trim().max(500, "Keep the reply under 500 characters.").default(""),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Accepts spaces, dashes and brackets while typing; stores digits with an optional leading +. */
export function normalizeMobile(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

const MOBILE_MESSAGE = "Enter a valid number with 7 to 15 digits, for example +919876543210.";

/** True when `raw` is empty, or looks like a phone number (digits plus spaces, dashes, dots, brackets, optional leading +). */
export function isValidMobile(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return true;
  if (!/^\+?[0-9\s().-]+$/.test(trimmed)) return false;
  return /^\+?[0-9]{7,15}$/.test(normalizeMobile(trimmed));
}

export const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Use 60 characters or fewer.").default(""),
  mobile: z
    .string()
    .trim()
    .default("")
    .refine(isValidMobile, MOBILE_MESSAGE)
    .transform((v) => (v === "" ? "" : normalizeMobile(v))),
});
