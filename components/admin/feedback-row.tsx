"use client";

import { useActionState } from "react";
import { updateFeedbackAction } from "@/app/actions/feedback";
import type { ActionState } from "@/lib/action-state";
import { STATUS_LABELS, type FeedbackStatus } from "@/lib/feedback";
import { inputClass } from "@/components/ui/field";

const ORDER: FeedbackStatus[] = ["new", "reviewing", "planned", "done", "declined"];

/** Admin controls for one feedback item: set a status and an optional reply the user will see. */
export function FeedbackRowForm({ id, status, note }: { id: string; status: string; note: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateFeedbackAction, {});
  return (
    <form action={formAction} className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4 sm:flex-row sm:items-start">
      <input type="hidden" name="id" value={id} />
      <label className="sm:w-44">
        <span className="sr-only">Status</span>
        <select name="status" defaultValue={status} className={`${inputClass} !min-h-11`}>
          {ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Reply shown to the user (optional)</span>
        <input name="note" defaultValue={note} maxLength={500} placeholder="Reply shown to the user (optional)" className={`${inputClass} !min-h-11`} />
      </label>
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state.ok && <span role="status" className="text-sm font-medium text-moss-deep">Saved</span>}
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
