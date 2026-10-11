import { TriangleAlert } from "lucide-react";

export function DbProblem({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-[var(--radius-card)] border border-danger/30 bg-danger-tint p-6 text-danger">
      <TriangleAlert aria-hidden="true" />
      <h2 className="mt-3 font-display text-lg font-semibold">We couldn&apos;t load your data</h2>
      <p className="mt-1 text-sm leading-6">{message}</p>
    </div>
  );
}
