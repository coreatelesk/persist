"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function Confirm({ confirmLabel, onCancel }: { confirmLabel: string; onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
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
          onClick={onCancel}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-ink-2 hover:bg-cream-deep"
        >
          Cancel
        </button>
      )}
    </span>
  );
}

/** Two-step destructive action: the first tap asks, the second confirms. */
export function ConfirmForm({
  action,
  id,
  label = "Delete",
  confirmLabel = "Confirm delete",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      {armed ? (
        <Confirm confirmLabel={confirmLabel} onCancel={() => setArmed(false)} />
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
  );
}
