"use client";

import { useActionState, useState } from "react";
import { submitFeedbackAction } from "@/app/actions/feedback";
import type { ActionState } from "@/lib/action-state";
import { CATEGORY_HINTS, CATEGORY_LABELS, type FeedbackCategory } from "@/lib/feedback";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const ORDER: FeedbackCategory[] = ["feature", "improvement", "bug", "other"];

export function FeedbackForm() {
  // Controlled, because React resets uncontrolled fields after every submit, even a failed one.
  const [category, setCategory] = useState<FeedbackCategory>("feature");
  const [message, setMessage] = useState("");
  const [state, formAction] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await submitFeedbackAction(prev, formData);
    if (result.ok) setMessage("");
    return result;
  }, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">What kind of feedback is it?</legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ORDER.map((c) => (
            <label
              key={c}
              className={`flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border px-4 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                category === c ? "border-moss bg-moss-tint ring-1 ring-moss" : "border-line-strong bg-white hover:bg-cream"
              }`}
            >
              <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} className="sr-only" />
              <span className="font-semibold text-navy">{CATEGORY_LABELS[c]}</span>
              <span className="text-sm text-ink-2">{CATEGORY_HINTS[c]}</span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {errors.category}
          </p>
        )}
      </fieldset>

      <Field label="Your message" htmlFor="message" hint={`${message.trim().length}/2000. Be as specific as you can: what you were trying to do, and what would help.`} error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={2000}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I'd love to be able to…"
          aria-invalid={!!errors.message}
          className={`${inputClass} py-3`}
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="rounded-xl bg-moss-tint px-4 py-3 text-sm font-medium text-moss-deep">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Sending…">Send feedback</SubmitButton>
    </form>
  );
}
