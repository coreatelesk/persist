import type { Metadata } from "next";
import { Flag, Plus } from "lucide-react";
import { ChallengeCard } from "@/components/challenge-card";
import { DbProblem } from "@/components/db-problem";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UsageNote } from "@/components/ui/usage-note";
import { requireUser } from "@/lib/auth/session";
import { describeChallenge } from "@/lib/tracking/challenges";
import { loadUsage } from "@/lib/limits";
import { loadTracking } from "@/lib/tracking/data";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const { supabase } = await requireUser();
  const { today, timeZone } = await getToday();
  const [t, usage] = await Promise.all([loadTracking(supabase, today, timeZone, 30), loadUsage(supabase)]);
  if (!t.ok) return <DbProblem message={t.error} />;
  const atLimit = usage.challenges.used >= usage.challenges.limit;

  const views = t.challenges.map((c) => describeChallenge(c, t.challengeCounts.get(c.id) ?? 0, today));
  const current = views.filter((c) => c.phase === "active" || c.phase === "upcoming");
  const past = views.filter((c) => c.phase === "completed" || c.phase === "ended");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Challenges"
        description="A stretch of effort with a start, an end, and a goal you can finish."
        action={
          atLimit ? undefined : (
            <ButtonLink href="/challenges/new">
              <Plus size={18} aria-hidden="true" /> New challenge
            </ButtonLink>
          )
        }
      />
      <UsageNote used={usage.challenges.used} limit={usage.challenges.limit} noun="challenge" resetsOn={usage.resetsOn} />

      {views.length === 0 ? (
        <EmptyState
          icon={<Flag size={22} aria-hidden="true" />}
          title="No challenges yet"
          body="Try 30 days of something that matters to you. Check in daily and finish with proof."
          action={atLimit ? undefined : <ButtonLink href="/challenges/new">Start a challenge</ButtonLink>}
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
    </div>
  );
}
