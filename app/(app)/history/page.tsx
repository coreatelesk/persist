import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Circle, Flag } from "lucide-react";
import { DbProblem } from "@/components/db-problem";
import { Card, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth/session";
import {
  addMonths,
  daysInMonth,
  diffDays,
  formatKey,
  isDateKey,
  isMonthKey,
  keyInZone,
  mondayIndex,
  monthOf,
  WEEKDAYS_MON_FIRST,
} from "@/lib/dates";
import { loadTracking } from "@/lib/tracking/data";
import { isDueOn, isFixedSchedule } from "@/lib/tracking/schedule";
import { doneKey, habitRate, habitStreak } from "@/lib/tracking/stats";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "History" };

const TEXT_ON: Record<number, string> = { 3: "text-white", 4: "text-white" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { today, timeZone } = await getToday();

  // There is nothing to show before the account existed, so history starts at the signup month.
  const currentMonth = monthOf(today);
  const joined = user.created_at ? monthOf(keyInZone(user.created_at, timeZone)) : currentMonth;
  const firstMonth = joined > currentMonth ? currentMonth : joined;
  const selectedFromUrl = isDateKey(params.date) ? params.date : undefined;
  const month = isMonthKey(params.month) ? params.month : selectedFromUrl ? monthOf(selectedFromUrl) : currentMonth;
  const visibleMonth = month > currentMonth ? currentMonth : month < firstMonth ? firstMonth : month;
  const selected = selectedFromUrl && monthOf(selectedFromUrl) === visibleMonth && selectedFromUrl <= today ? selectedFromUrl : visibleMonth === currentMonth ? today : `${visibleMonth}-01`;

  const monthStart = `${visibleMonth}-01`;
  const windowDays = Math.min(1100, Math.max(60, diffDays(monthStart, today) + 1));
  const t = await loadTracking(supabase, today, timeZone, windowDays);
  if (!t.ok) return <DbProblem message={t.error} />;

  const cells = new Map(t.days.map((d) => [d.date, d]));
  const total = daysInMonth(visibleMonth);
  const lead = mondayIndex(monthStart);
  const monthDays = t.days.filter((d) => monthOf(d.date) === visibleMonth);
  const monthDone = monthDays.reduce((s, d) => s + d.done, 0);
  const activeDays = monthDays.filter((d) => d.done > 0).length;

  // Day detail
  const detailHabits = t.habits
    .map((h, i) => ({ habit: h, lite: t.habitLite[i] }))
    .filter(({ habit, lite }) => {
      const completed = t.habitDone.has(doneKey(habit.id, selected));
      const existed = selected >= lite.startKey && (lite.endKey === null || selected < lite.endKey);
      if (completed) return true;
      return existed && isFixedSchedule(habit.schedule) && isDueOn(habit.schedule, selected);
    })
    .map(({ habit }) => ({ id: habit.id, title: habit.title, done: t.habitDone.has(doneKey(habit.id, selected)) }));
  const detailChallenges = t.challenges
    .filter((c) => t.challengeDone.has(doneKey(c.id, selected)) || (c.status !== "archived" && selected >= c.starts_on && selected <= c.ends_on))
    .map((c) => ({ id: c.id, title: c.title, done: t.challengeDone.has(doneKey(c.id, selected)) }));
  const detailTotal = detailHabits.length + detailChallenges.length;
  const detailDone = [...detailHabits, ...detailChallenges].filter((x) => x.done).length;

  const nav = (m: string) => `/history?month=${m}`;
  const rows = t.activeHabits.map((habit) => {
    const lite = t.habitLite.find((l) => l.id === habit.id)!;
    return { habit, rate: habitRate(lite, t.habitDone, today), streak: habitStreak(lite, t.habitDone, today) };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">History</h1>
        <p className="mt-2 text-base text-ink-2">Every check-in you&apos;ve logged, day by day.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">{formatKey(monthStart, "month")}</h2>
              <p className="text-sm text-ink-2">
                {activeDays} active {activeDays === 1 ? "day" : "days"}, {monthDone} {monthDone === 1 ? "check-in" : "check-ins"}
              </p>
            </div>
            <div className="flex gap-1">
              {visibleMonth > firstMonth ? (
                <Link href={nav(addMonths(visibleMonth, -1))} aria-label="Previous month" className="grid size-11 place-items-center rounded-xl border border-line-strong hover:bg-cream-deep">
                  <ChevronLeft size={19} aria-hidden="true" />
                </Link>
              ) : (
                <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-line text-line-strong">
                  <ChevronLeft size={19} />
                </span>
              )}
              {visibleMonth < currentMonth ? (
                <Link href={nav(addMonths(visibleMonth, 1))} aria-label="Next month" className="grid size-11 place-items-center rounded-xl border border-line-strong hover:bg-cream-deep">
                  <ChevronRight size={19} aria-hidden="true" />
                </Link>
              ) : (
                <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-line text-line-strong">
                  <ChevronRight size={19} />
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS_MON_FIRST.map((d) => (
              <span key={d.index} className="pb-1 text-center text-xs font-medium text-ink-3">
                {d.short}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`pad-${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: total }, (_, i) => {
              const date = `${visibleMonth}-${String(i + 1).padStart(2, "0")}`;
              const cell = cells.get(date);
              const future = date > today;
              const level = cell?.level ?? -1;
              const bg = future ? "transparent" : level === -1 ? "var(--heat-off)" : `var(--heat-${level})`;
              const isSelected = date === selected;
              const label = future
                ? formatKey(date)
                : `${formatKey(date)}: ${cell && cell.total > 0 ? `${cell.done} of ${cell.total} done` : "nothing scheduled"}`;
              const body = (
                <span
                  className={`grid aspect-square place-items-center rounded-lg text-sm font-semibold transition ${TEXT_ON[level] ?? "text-navy"} ${
                    future ? "border border-dashed border-line text-ink-3" : ""
                  } ${isSelected ? "ring-2 ring-navy ring-offset-2" : ""} ${date === today ? "outline outline-2 outline-offset-1 outline-gold" : ""}`}
                  style={{ background: bg }}
                >
                  {i + 1}
                </span>
              );
              return future ? (
                <span key={date} aria-label={label}>
                  {body}
                </span>
              ) : (
                <Link key={date} href={`/history?month=${visibleMonth}&date=${date}`} prefetch={false} aria-label={label} aria-current={isSelected ? "date" : undefined} className="rounded-lg">
                  {body}
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardTitle hint={detailTotal ? `${detailDone} of ${detailTotal} done` : "Nothing was scheduled"}>{formatKey(selected, "long")}</CardTitle>
          {detailTotal > 0 ? (
            <ul className="mt-4 space-y-2">
              {detailHabits.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl bg-cream/70 px-3.5 py-3">
                  {x.done ? <Check size={18} strokeWidth={3} className="shrink-0 text-moss" aria-label="Done" /> : <Circle size={18} className="shrink-0 text-ink-3" aria-label="Not done" />}
                  <span className={`min-w-0 truncate font-medium ${x.done ? "text-navy" : "text-ink-3"}`}>{x.title}</span>
                </li>
              ))}
              {detailChallenges.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl bg-teal-tint/70 px-3.5 py-3">
                  {x.done ? <Check size={18} strokeWidth={3} className="shrink-0 text-moss" aria-label="Done" /> : <Circle size={18} className="shrink-0 text-ink-3" aria-label="Not done" />}
                  <span className={`flex min-w-0 items-center gap-1.5 truncate font-medium ${x.done ? "text-navy" : "text-ink-3"}`}>
                    <Flag size={13} className="shrink-0 text-teal" aria-hidden="true" />
                    <span className="truncate">{x.title}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-2">No habits or challenges were active on this day.</p>
          )}
        </Card>
      </div>

      {rows.length > 0 && (
        <Card>
          <CardTitle hint="How often you did each habit over the last 30 days.">By habit</CardTitle>
          <ul className="mt-4 divide-y divide-line">
            {rows.map(({ habit, rate, streak }) => (
              <li key={habit.id} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_14rem_6rem]">
                <span className="truncate font-medium text-navy">{habit.title}</span>
                <ProgressBar value={rate ?? 0} label={`${habit.title} completion rate`} />
                <span className="text-sm tabular-nums text-ink-2 sm:text-right">
                  {rate === null ? "No data" : `${rate}%`}
                  {streak.count > 1 && <span className="text-gold-deep"> · {streak.count}{streak.unit === "week" ? "w" : "d"}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
