import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { deleteChallengeAction, endChallengeAction } from "@/app/actions/challenges";
import { challengeNote, PhaseBadge } from "@/components/challenge-card";
import { CheckinButton } from "@/components/checkin-button";
import { DbProblem } from "@/components/db-problem";
import { Card } from "@/components/ui/card";
import { ConfirmForm } from "@/components/ui/confirm-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth/session";
import { addDays, formatKey, diffDays } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";
import { describeChallenge } from "@/lib/tracking/challenges";
import { idSchema } from "@/lib/validation";
import { getToday } from "@/lib/tz";
import type { Challenge } from "@/lib/tracking/types";

export const metadata: Metadata = { title: "Challenge" };

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const { supabase } = await requireUser();
  const { today } = await getToday();

  const [challengeRes, doneRes] = await Promise.all([
    supabase
      .from("challenges")
      .select("id,title,description,starts_on,ends_on,target_days,status,completed_at,created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("challenge_completions").select("completed_on").eq("challenge_id", id).limit(1000),
  ]);
  if (challengeRes.error || doneRes.error) {
    return <DbProblem message={friendlyDbError(challengeRes.error ?? doneRes.error)} />;
  }
  if (!challengeRes.data) notFound();

  const done = new Set((doneRes.data ?? []).map((r) => r.completed_on as string));
  const challenge = challengeRes.data as Challenge;
  const view = describeChallenge(challenge, done.size, today);
  const days = Array.from({ length: view.totalDays }, (_, i) => addDays(challenge.starts_on, i));
  const canCheckIn = view.phase === "active" || (view.phase === "completed" && today >= challenge.starts_on && today <= challenge.ends_on);
  const todayDone = done.has(today);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/challenges" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Challenges
      </Link>

      <header>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="min-w-0 max-w-full [overflow-wrap:anywhere] font-display text-2xl font-bold leading-tight text-navy sm:text-4xl">{challenge.title}</h1>
          <PhaseBadge phase={view.phase} />
        </div>
        {challenge.description && <p className="mt-2 max-w-xl text-base text-ink-2 [overflow-wrap:anywhere]">{challenge.description}</p>}
        <p className="mt-2 text-sm text-ink-3">
          {formatKey(challenge.starts_on, "medium")} to {formatKey(challenge.ends_on, "medium")}
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-5xl font-bold leading-none text-navy tabular-nums">
              {view.done}
              <span className="text-3xl text-ink-3"> / {view.target_days}</span>
            </p>
            <p className="mt-2 text-sm text-ink-2">days checked in</p>
          </div>
          {view.phase === "completed" ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-tint px-4 py-2 text-sm font-semibold text-gold-deep">
              <Trophy size={16} aria-hidden="true" /> Goal reached
            </span>
          ) : (
            <p className={`text-sm ${view.atRisk ? "font-medium text-gold-deep" : "text-ink-2"}`}>{challengeNote(view)}</p>
          )}
        </div>
        <ProgressBar value={view.pct} label="Challenge progress" tone={view.phase === "completed" ? "gold" : "moss"} className="mt-5" />

        {canCheckIn && (
          <div className="mt-6">
            <CheckinButton challengeId={challenge.id} date={today} done={todayDone} />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-navy">Every day</h2>
        <p className="mt-0.5 text-sm text-ink-2">Green days are proof you showed up.</p>
        <div className="mt-4 flex flex-wrap gap-1.5" role="img" aria-label={`${view.done} of ${view.totalDays} days checked in`}>
          {days.map((date, i) => {
            const isDone = done.has(date);
            const future = date > today;
            return (
              <span
                key={date}
                className="heat !size-6 !rounded-md"
                data-level={isDone ? 4 : future ? undefined : 0}
                data-today={date === today}
                title={`Day ${i + 1}, ${formatKey(date)}${isDone ? ": done" : future ? "" : ": missed"}`}
              />
            );
          })}
        </div>
        {today > challenge.starts_on && today <= challenge.ends_on && (
          <p className="mt-3 text-xs text-ink-3">Day {diffDays(challenge.starts_on, today) + 1} is highlighted in gold.</p>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-1">
        {view.phase === "active" && (
          <form action={endChallengeAction}>
            <input type="hidden" name="id" value={challenge.id} />
            <button className="min-h-10 rounded-lg px-3 text-sm font-semibold text-ink-2 hover:bg-cream-deep">End challenge early</button>
          </form>
        )}
        <ConfirmForm action={deleteChallengeAction} id={challenge.id} confirmLabel="Delete forever" label="Delete challenge" />
      </div>
    </div>
  );
}
