import Link from "next/link";
import { Flag } from "lucide-react";
import { formatKey } from "@/lib/dates";
import type { ChallengeView } from "@/lib/tracking/challenges";
import { ProgressBar } from "@/components/ui/progress-bar";

const PHASE: Record<ChallengeView["phase"], { label: string; className: string }> = {
  active: { label: "In progress", className: "bg-teal-tint text-teal" },
  upcoming: { label: "Starts soon", className: "bg-cream-deep text-ink-2" },
  completed: { label: "Completed", className: "bg-moss-tint text-moss-deep" },
  ended: { label: "Ended", className: "bg-cream-deep text-ink-2" },
  archived: { label: "Archived", className: "bg-cream-deep text-ink-2" },
};

export function PhaseBadge({ phase }: { phase: ChallengeView["phase"] }) {
  const { label, className } = PHASE[phase];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

export function challengeNote(c: ChallengeView): string {
  switch (c.phase) {
    case "active":
      if (c.atRisk) return `${c.remainingNeeded} more needed, ${c.daysLeft} ${c.daysLeft === 1 ? "day" : "days"} left`;
      return `Day ${c.dayNumber} of ${c.totalDays}, ${c.daysLeft} ${c.daysLeft === 1 ? "day" : "days"} left`;
    case "upcoming":
      return `Starts ${formatKey(c.starts_on, "medium")}`;
    case "completed":
      return "Goal reached";
    default:
      return `${formatKey(c.starts_on, "short")} to ${formatKey(c.ends_on, "short")}`;
  }
}

export function ChallengeCard({ challenge }: { challenge: ChallengeView }) {
  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className="block min-w-0 rounded-[var(--radius-card)] border border-line bg-white p-4 transition sm:p-5 hover:border-line-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-tint text-teal">
            <Flag size={18} aria-hidden="true" />
          </span>
          <h3 className="min-w-0 line-clamp-2 font-display text-lg font-semibold leading-snug text-navy [overflow-wrap:anywhere]">{challenge.title}</h3>
        </div>
        <PhaseBadge phase={challenge.phase} />
      </div>
      <ProgressBar
        value={challenge.pct}
        label={`${challenge.title} progress`}
        tone={challenge.phase === "completed" ? "gold" : "moss"}
        className="mt-4"
      />
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
        <span className="font-semibold text-navy tabular-nums">
          {challenge.done} of {challenge.target_days} days
        </span>
        <span className={`${challenge.atRisk ? "font-medium text-gold-deep" : "text-ink-2"}`}>{challengeNote(challenge)}</span>
      </div>
    </Link>
  );
}
