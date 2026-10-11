import type { Metadata } from "next";
import { CalendarCheck, Flame, Plus, Repeat2, TrendingUp } from "lucide-react";
import { ChallengeCard } from "@/components/challenge-card";
import { DbProblem } from "@/components/db-problem";
import { Heatmap, HeatmapLegend } from "@/components/heatmap";
import { Stat } from "@/components/stat";
import { TodayPanel, type TodayItem } from "@/components/today-panel";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { addDays, formatKey, hourIn } from "@/lib/dates";
import { describeChallenge } from "@/lib/tracking/challenges";
import { loadTracking } from "@/lib/tracking/data";
import { isDueOn, scheduleLabel } from "@/lib/tracking/schedule";
import { bestStreak, completionRate, currentStreak, doneKey, habitStreak, weekCount } from "@/lib/tracking/stats";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "Today" };

const MILESTONES: Record<number, string> = {
  7: "One full week",
  14: "Two weeks strong",
  30: "A month of showing up",
  60: "Two months running",
  100: "Triple digits",
  365: "A full year",
};

function milestone(streak: number) {
  const hit = Object.keys(MILESTONES)
    .map(Number)
    .filter((n) => streak >= n)
    .pop();
  return hit ? MILESTONES[hit] : undefined;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { today, timeZone } = await getToday();
  const t = await loadTracking(supabase, today, timeZone);
  if (!t.ok) return <DbProblem message={t.error} />;

  const hour = hourIn(timeZone);
  const first = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.split(" ")[0] : "";
  const greeting = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}${first ? `, ${first}` : ""}`;

  const liteById = new Map(t.habitLite.map((h) => [h.id, h]));
  const challengeViews = t.challenges.map((c) => describeChallenge(c, t.challengeCounts.get(c.id) ?? 0, today));
  const running = challengeViews.filter((c) => c.phase === "active");
  const upcoming = challengeViews.filter((c) => c.phase === "upcoming");

  const items: TodayItem[] = [];
  for (const habit of t.activeHabits) {
    if (!isDueOn(habit.schedule, today)) continue;
    const lite = liteById.get(habit.id)!;
    const streak = habitStreak(lite, t.habitDone, today);
    let detail = habit.description || scheduleLabel(habit.schedule);
    if (habit.schedule.kind === "weekly_target") {
      detail = `${weekCount(habit.id, t.habitDone, today)} of ${habit.schedule.target} this week`;
    }
    items.push({
      key: `h-${habit.id}`,
      kind: "habit",
      id: habit.id,
      title: habit.title,
      detail,
      done: t.habitDone.has(doneKey(habit.id, today)),
      streak: streak.count >= 2 ? `${streak.count}${streak.unit === "week" ? "w" : "d"}` : undefined,
    });
  }
  for (const c of running) {
    items.push({
      key: `c-${c.id}`,
      kind: "challenge",
      id: c.id,
      title: c.title,
      detail: `Day ${c.dayNumber} of ${c.totalDays} · ${c.done}/${c.target_days} done`,
      done: t.challengeDone.has(doneKey(c.id, today)),
      href: `/challenges/${c.id}`,
    });
  }

  const earliest = t.habitLite.reduce((min, h) => (h.startKey < min ? h.startKey : min), today);
  const shownFrom = earliest < addDays(today, -181) ? earliest : addDays(today, -181);
  const heatDays = t.days.filter((d) => d.date >= shownFrom);

  const streak = currentStreak(t.days, today);
  const best = bestStreak(t.days);
  const rate = completionRate(t.days, 30);
  const totalCheckins = t.days.reduce((sum, d) => sum + d.done, 0);
  const noHabitsYet = t.activeHabits.length === 0 && running.length === 0;
  const streakNote = milestone(streak);

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description={formatKey(today, "long")}
        action={
          <ButtonLink href="/habits/new">
            <Plus size={18} aria-hidden="true" /> New habit
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <Card>
          {noHabitsYet ? (
            <EmptyState
              icon={<Repeat2 size={22} aria-hidden="true" />}
              title="Start with one small habit"
              body="Pick something you can do even on a hard day. You'll check it off here every day."
              action={<ButtonLink href="/habits/new">Create your first habit</ButtonLink>}
            />
          ) : (
            <TodayPanel items={items} date={today} />
          )}
        </Card>

        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4 lg:self-start">
          <Stat
            icon={<Flame size={15} aria-hidden="true" />}
            label="Streak"
            value={`${streak}`}
            note={streakNote ?? (streak === 1 ? "day in a row" : "days in a row")}
            accent={!!streakNote}
          />
          <Stat icon={<TrendingUp size={15} aria-hidden="true" />} label="30 days" value={rate === null ? "–" : `${rate}%`} note="of plan done" />
          <Stat icon={<CalendarCheck size={15} aria-hidden="true" />} label="Best" value={`${best}`} note={best === 1 ? "day streak" : "day streak"} />
        </div>
      </div>

      {(running.length > 0 || upcoming.length > 0) && (
        <section aria-labelledby="challenges-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="challenges-heading" className="font-display text-xl font-semibold text-navy">
              Challenges
            </h2>
            <ButtonLink href="/challenges" variant="quiet" className="min-h-9 px-3.5">
              View all
            </ButtonLink>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...running, ...upcoming].slice(0, 4).map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </section>
      )}

      <Card>
        <CardTitle
          hint={`${totalCheckins} ${totalCheckins === 1 ? "check-in" : "check-ins"} tracked. Select a day for details.`}
          action={<HeatmapLegend />}
        >
          Your consistency
        </CardTitle>
        <div className="mt-5">
          <Heatmap days={heatDays} today={today} />
        </div>
      </Card>
    </div>
  );
}
