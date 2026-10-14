import type { Metadata } from "next";
import { Flag, Plus } from "lucide-react";
import { archiveChallengeAction, deleteChallengeAction } from "@/app/actions/challenges";
import { ActionButton } from "@/components/action-button";
import { ChallengeCard } from "@/components/challenge-card";
import { DbProblem } from "@/components/db-problem";
import { LimitMeter } from "@/components/limit-meter";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmForm } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { formatKey } from "@/lib/dates";
import { getEntitlements, hasRoom } from "@/lib/entitlements";
import { describeChallenge } from "@/lib/tracking/challenges";
import { loadTracking } from "@/lib/tracking/data";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const { supabase } = await requireUser();
  const { today, timeZone } = await getToday();
  const [t, ent] = await Promise.all([loadTracking(supabase, today, timeZone, 30), getEntitlements(supabase)]);
  if (!t.ok) return <DbProblem message={t.error} />;

  const canCreate = hasRoom(ent, "active_challenges");
  const views = t.challenges.map((c) => describeChallenge(c, t.challengeCounts.get(c.id) ?? 0, today));
  const current = views.filter((c) => c.phase === "active" || c.phase === "upcoming");
  const past = views.filter((c) => c.phase === "completed" || c.phase === "ended");
  const archived = views.filter((c) => c.phase === "archived");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Challenges"
        description="A stretch of effort with a start, an end, and a goal you can finish."
        action={
          canCreate ? (
            <ButtonLink href="/challenges/new">
              <Plus size={18} aria-hidden="true" /> New challenge
            </ButtonLink>
          ) : undefined
        }
      />

      <LimitMeter entitlements={ent} noun="challenges" />

      {views.length === 0 ? (
        <EmptyState
          icon={<Flag size={22} aria-hidden="true" />}
          title="No challenges yet"
          body="Try 30 days of something that matters to you. Check in daily and finish with proof."
          action={canCreate ? <ButtonLink href="/challenges/new">Start a challenge</ButtonLink> : undefined}
        />
      ) : (
        <>
          {current.length > 0 && (
            <section aria-labelledby="current-heading">
              <h2 id="current-heading" className="mb-3 font-display text-xl font-semibold text-navy">
                Current
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {current.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="mb-3 font-display text-xl font-semibold text-navy">
                Finished
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {past.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {archived.length > 0 && (
        <details className="rounded-[var(--radius-card)] border border-line bg-white/70 p-5" open={!canCreate}>
          <summary className="cursor-pointer font-display text-lg font-semibold text-navy">Archived ({archived.length})</summary>
          <p className="mt-2 text-sm text-ink-2">
            Archived challenges keep all their check-ins.
            {!canCreate && " Your active challenges are full, so a running challenge can't be restored until you finish, archive, or delete one."}
          </p>
          <ul className="mt-3 divide-y divide-line">
            {archived.map((c) => {
              // Finished challenges come back as finished, so only a still-running one needs an active slot.
              const needsSlot = !c.completed_at && today <= c.ends_on;
              return (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0 max-w-full py-1.5">
                    <p className="truncate font-medium text-navy">{c.title}</p>
                    <p className="text-xs text-ink-3">
                      {formatKey(c.starts_on, "short")} to {formatKey(c.ends_on, "short")} · {c.done} check-ins
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start">
                    <ActionButton
                      action={archiveChallengeAction}
                      id={c.id}
                      label="Restore"
                      pendingLabel="Restoring…"
                      restore
                      disabled={needsSlot && !canCreate}
                    />
                    <ConfirmForm action={deleteChallengeAction} id={c.id} confirmLabel="Delete forever" />
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
