"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-[var(--radius-card)] border border-line bg-white p-8 text-center">
      <h1 className="font-display text-xl font-semibold text-navy">Couldn&apos;t load admin data</h1>
      <p className="mt-2 text-sm text-ink-2">
        This usually means the latest database migration hasn&apos;t been run yet. Check the README, then try again.
      </p>
      <button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-moss px-5 text-sm font-semibold text-white hover:bg-moss-deep">
        Try again
      </button>
    </div>
  );
}
