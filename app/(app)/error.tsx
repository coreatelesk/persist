"use client";

import { TriangleAlert } from "lucide-react";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-[var(--radius-card)] border border-line bg-white p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger-tint text-danger">
        <TriangleAlert aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-2">That page didn&apos;t load. Your data is safe. Try again in a moment.</p>
      <button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-moss px-5 text-sm font-semibold text-white hover:bg-moss-deep">
        Try again
      </button>
    </div>
  );
}
