"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/action-state";

/** Two-step destructive action: the first tap asks, the second confirms. Errors show inline. */
export function ConfirmForm({
  action,
  id,
  label = "Delete",
  confirmLabel = "Confirm delete",
  redirectAfter = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label?: string;
  confirmLabel?: string;
  redirectAfter?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <div className="inline-flex flex-col items-start">
      <form action={formAction} className="inline-flex">
        <input type="hidden" name="id" value={id} />
        {redirectAfter && <input type="hidden" name="redirect" value="1" />}
        {armed ? (
          <span className="inline-flex items-center gap-1">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-lg bg-danger px-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {pending ? "Deleting…" : confirmLabel}
            </button>
            {!pending && (
              <button
                type="button"
                onClick={() => setArmed(false)}
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-ink-2 hover:bg-cream-deep"
              >
                Cancel
              </button>
            )}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setArmed(true)}
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-danger hover:bg-danger-tint"
          >
            {label}
          </button>
        )}
      </form>
      {state.error && (
        <p role="alert" className="mt-1 max-w-xs px-3 text-sm text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
