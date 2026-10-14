import { ProgressBar } from "@/components/ui/progress-bar";
import type { Entitlements } from "@/lib/entitlements";
import type { LimitKind } from "@/lib/limit-messages";

type Noun = "habits" | "challenges";

function Row({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  const full = cap !== null && used >= cap;
  const pct = cap === null || cap === 0 ? 0 : Math.min(100, (used / cap) * 100);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-ink-2">{label}</span>
        <span className={`font-semibold tabular-nums ${full ? "text-gold-deep" : "text-navy"}`}>
          {used}
          {cap !== null && <span className="font-normal text-ink-3"> / {cap}</span>}
        </span>
      </div>
      <ProgressBar value={pct} label={`${label}: ${used}${cap === null ? "" : ` of ${cap}`}`} tone={full ? "gold" : "moss"} className="mt-1.5 !h-2" />
    </div>
  );
}

/**
 * Shows how much of the plan's allowance is used, and when a limit is reached explains
 * what the person can do next. Wording matches what the server enforces.
 */
export function LimitMeter({ entitlements, noun }: { entitlements: Entitlements; noun: Noun }) {
  const active: LimitKind = noun === "habits" ? "active_habits" : "active_challenges";
  const archived: LimitKind = noun === "habits" ? "archived_habits" : "archived_challenges";
  const aCap = entitlements.limits[active];
  const zCap = entitlements.limits[archived];
  const aUsed = entitlements.usage[active];
  const zUsed = entitlements.usage[archived];
  const activeFull = aCap !== null && aUsed >= aCap;
  const archiveFull = zCap !== null && zUsed >= zCap;
  const over = (aCap !== null && aUsed > aCap) || (zCap !== null && zUsed > zCap);
  const singular = noun === "habits" ? "habit" : "challenge";

  const tips: string[] = [];
  if (activeFull) {
    tips.push(
      noun === "habits"
        ? `Your active habits are full. To add another, archive or delete one you no longer need.`
        : `Your active challenges are full. To start another, finish, archive, or delete one.`,
    );
  }
  if (archiveFull) {
    tips.push(`Your archive is full. Before archiving another ${singular}, delete an archived one you don't need or restore one.`);
  }

  return (
    <section aria-label={`${noun} allowance`} className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <Row label={`Active ${noun}`} used={aUsed} cap={aCap} />
        <Row label={`Archived ${noun}`} used={zUsed} cap={zCap} />
      </div>
      {tips.length > 0 && (
        <div role="status" className="mt-3 rounded-xl bg-gold-tint px-3.5 py-3 text-sm text-gold-deep">
          {over && (
            <p className="mb-1 font-semibold">
              You&apos;re over the {entitlements.planName} plan&apos;s limit. Nothing has been removed, and all your history is safe.
            </p>
          )}
          {tips.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {over && <p className="mt-1">You can keep using everything you have; new additions resume once you&apos;re within the limit.</p>}
        </div>
      )}
    </section>
  );
}
