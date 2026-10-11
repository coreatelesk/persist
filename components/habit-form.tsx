"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createHabitAction, updateHabitAction } from "@/app/actions/habits";
import type { ActionState } from "@/lib/action-state";
import { WEEKDAYS_MON_FIRST } from "@/lib/dates";
import type { Habit, HabitSchedule } from "@/lib/tracking/types";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const KINDS: { value: HabitSchedule["kind"]; title: string; body: string }[] = [
  { value: "daily", title: "Every day", body: "A steady daily rhythm" },
  { value: "weekdays", title: "Weekdays", body: "Monday to Friday" },
  { value: "custom", title: "Specific days", body: "Pick the days that fit" },
  { value: "weekly_target", title: "Times a week", body: "Any days, you set the goal" },
];

export function HabitForm({ habit }: { habit?: Habit }) {
  const action = habit ? updateHabitAction.bind(null, habit.id) : createHabitAction;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const initial = habit?.schedule ?? { kind: "daily" as const };
  const [kind, setKind] = useState<HabitSchedule["kind"]>(initial.kind);
  const [days, setDays] = useState<number[]>(initial.kind === "custom" ? initial.days : [1, 3, 5]);
  const [target, setTarget] = useState(initial.kind === "weekly_target" ? initial.target : 3);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-7">
      <Field label="Habit name" htmlFor="title" error={errors.title}>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          autoFocus={!habit}
          defaultValue={habit?.title}
          placeholder="Read for 20 minutes"
          aria-invalid={!!errors.title}
          className={inputClass}
        />
      </Field>

      <Field label="Note (optional)" htmlFor="description" hint="What does showing up look like?" error={errors.description}>
        <input
          id="description"
          name="description"
          maxLength={240}
          defaultValue={habit?.description ?? ""}
          placeholder="Even two pages counts"
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">How often?</legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border px-4 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                kind === option.value ? "border-moss bg-moss-tint ring-1 ring-moss" : "border-line-strong bg-white hover:bg-cream"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-navy">{option.title}</span>
              <span className="text-sm text-ink-2">{option.body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {kind === "custom" && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-navy">Which days?</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS_MON_FIRST.map((day) => {
              const on = days.includes(day.index);
              return (
                <label
                  key={day.index}
                  className={`grid size-12 cursor-pointer place-items-center rounded-full border text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                    on ? "border-moss bg-moss text-white" : "border-line-strong bg-white text-navy hover:bg-cream"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="days"
                    value={day.index}
                    checked={on}
                    onChange={() => setDays(on ? days.filter((d) => d !== day.index) : [...days, day.index])}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{day.short.slice(0, 2)}</span>
                  <span className="sr-only">{day.long}</span>
                </label>
              );
            })}
          </div>
          {errors.days && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {errors.days}
            </p>
          )}
        </fieldset>
      )}

      {kind === "weekly_target" && (
        <Field label="Goal per week" htmlFor="target" hint="You can check in on any day. The week resets on Monday.">
          <select
            id="target"
            name="target"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className={inputClass}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "time" : "times"} a week
              </option>
            ))}
          </select>
        </Field>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="Saving…">{habit ? "Save changes" : "Create habit"}</SubmitButton>
        <Link href="/habits" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-ink-2 hover:bg-cream-deep">
          Cancel
        </Link>
      </div>
    </form>
  );
}
