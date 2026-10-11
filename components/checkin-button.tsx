"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setCheckinAction } from "@/app/actions/checkins";

/** Large check-in button for a single challenge, with instant feedback. */
export function CheckinButton({ challengeId, date, done }: { challengeId: string; date: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done, (_current, next: boolean) => next);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticDone;
    setError(null);
    startTransition(async () => {
      setOptimisticDone(next);
      const result = await setCheckinAction({ kind: "challenge", id: challengeId, date, done: next });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimisticDone}
        className={`flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold transition sm:w-auto sm:px-8 ${
          optimisticDone ? "bg-moss-tint text-moss-deep ring-1 ring-moss/30" : "bg-moss text-white hover:bg-moss-deep"
        }`}
      >
        <Check size={20} strokeWidth={3} aria-hidden="true" />
        {optimisticDone ? "Checked in today. Tap to undo" : "Check in for today"}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
