"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/action-state";

/**
 * A small form button for archive / restore / end style actions.
 * Shows a clear message under the button when the server refuses (for example, a full limit).
 */
export function ActionButton({
  action,
  id,
  label,
  pendingLabel,
  restore = false,
  disabled = false,
  disabledNote,
  tone = "quiet",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label: string;
  pendingLabel?: string;
  restore?: boolean;
  disabled?: boolean;
  /** Short explanation shown when the button is disabled because a limit is reached. */
  disabledNote?: string;
  tone?: "quiet" | "primary";
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const color =
    tone === "primary"
      ? "bg-moss text-white hover:bg-moss-deep disabled:bg-cream-deep disabled:text-ink-3"
      : "text-ink-2 hover:bg-cream-deep disabled:text-ink-3 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex flex-col items-start">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        {restore && <input type="hidden" name="restore" value="1" />}
        <button
          type="submit"
          disabled={disabled || pending}
          aria-describedby={disabled && disabledNote ? `note-${id}-${label}` : undefined}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-not-allowed ${color}`}
        >
          {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {pending ? (pendingLabel ?? label) : label}
        </button>
      </form>
      {disabled && disabledNote && (
        <p id={`note-${id}-${label}`} className="max-w-[16rem] px-3 pb-1 text-xs text-ink-3">
          {disabledNote}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-1 max-w-xs px-3 text-sm text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
