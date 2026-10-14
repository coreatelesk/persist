"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createChallengeAction } from "@/app/actions/challenges";
import type { ActionState } from "@/lib/action-state";
import { addDays, formatKey } from "@/lib/dates";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const PRESETS = [7, 14, 21, 30, 60, 90];

export function ChallengeForm({ today }: { today: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createChallengeAction, {});
  const [duration, setDuration] = useState(30);
  const [target, setTarget] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  // Controlled, because React resets uncontrolled fields after every submit, even a failed one.
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const errors = state.fieldErrors ?? {};

  const validDuration = Number.isInteger(duration) && duration >= 1 && duration <= 365;
  const endsOn = validDuration && startsOn ? addDays(startsOn, duration - 1) : null;

  return (
    <form action={formAction} className="space-y-6 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-7">
      <Field label="Challenge name" htmlFor="title" error={errors.title}>
        <input
          id="title"
          name="title"
          required
          maxLength={100}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="30 days of writing"
          aria-invalid={!!errors.title}
          className={inputClass}
        />
      </Field>

      <Field label="Why does it matter? (optional)" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Finish the first draft of my book."
          className={`${inputClass} py-3`}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">How long?</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDuration(n)}
              aria-pressed={duration === n}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
                duration === n ? "border-moss bg-moss text-white" : "border-line-strong bg-white text-navy hover:bg-cream"
              }`}
            >
              {n} days
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="durationDays" className="text-sm text-ink-2">
            Or choose your own
          </label>
          <input
            id="durationDays"
            name="durationDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={Number.isNaN(duration) ? "" : duration}
            onChange={(e) => setDuration(e.target.value === "" ? NaN : Number(e.target.value))}
            className={`${inputClass} !w-24 text-center`}
            aria-invalid={!!errors.durationDays}
          />
          <span className="text-sm text-ink-2">days</span>
        </div>
        {errors.durationDays && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {errors.durationDays}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Start date" htmlFor="startsOn" error={errors.startsOn}>
          <input
            id="startsOn"
            name="startsOn"
            type="date"
            required
            min={addDays(today, -7)}
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Goal (days to check in)"
          htmlFor="targetDays"
          hint={validDuration ? `Leave blank to aim for all ${duration}.` : undefined}
          error={errors.targetDays}
        >
          <input
            id="targetDays"
            name="targetDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={validDuration ? duration : 365}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={validDuration ? String(duration) : ""}
            className={inputClass}
          />
        </Field>
      </div>

      {endsOn && (
        <p className="rounded-xl bg-teal-tint px-4 py-3 text-sm text-navy">
          Runs {formatKey(startsOn, "medium")} to {formatKey(endsOn, "medium")}.
          {target && Number(target) < duration ? ` You'll need ${target} check-ins to complete it.` : ""}
        </p>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <SubmitButton pendingLabel="Creating…">Start challenge</SubmitButton>
        <Link href="/challenges" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-ink-2 hover:bg-cream-deep">
          Cancel
        </Link>
      </div>
    </form>
  );
}
