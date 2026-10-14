import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Pencil, Plus, Repeat2 } from "lucide-react";
import { archiveHabitAction, deleteHabitAction } from "@/app/actions/habits";
import { ActionButton } from "@/components/action-button";
import { DbProblem } from "@/components/db-problem";
import { LimitMeter } from "@/components/limit-meter";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmForm } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { addDays, formatKey } from "@/lib/dates";
import { getEntitlements, hasRoom } from "@/lib/entitlements";
import { loadTracking } from "@/lib/tracking/data";
import { scheduleLabel } from "@/lib/tracking/schedule";
import { doneKey, habitRate, habitStreak, weekCount } from "@/lib/tracking/stats";
import { getToday } from "@/lib/tz";
import type { Habit } from "@/lib/tracking/types";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const { supabase } = await requireUser();
  const { today, timeZone } = await getToday();
  const [t, ent] = await Promise.all([loadTracking(supabase, today, timeZone, 120), getEntitlements(supabase)]);
  if (!t.ok) return <DbProblem message={t.error} />;

  const canCreate = hasRoom(ent, "active_habits");
  const canArchive = hasRoom(ent, "archived_habits");
  const lite = new Map(t.habitLite.map((h) => [h.id, h]));
  const archived = t.habits.filter((h) => h.archived_at);
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, -(13 - i)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Routines you repeat. Each check-in is saved as proof."
        action={
          canCreate ? (
            <ButtonLink href="/habits/new">
              <Plus size={18} aria-hidden="true" /> New habit
            </ButtonLink>
          ) : undefined
        }
      />

      <LimitMeter entitlements={ent} noun="habits" />

      {t.activeHabits.length === 0 ? (
        <EmptyState
          icon={<Repeat2 size={22} aria-hidden="true" />}
          title="No active habits"
          body={archived.length ? "Restore an archived habit below, or start a new one." : "Start with one that's small enough to do on your worst day."}
          action={canCreate ? <ButtonLink href="/habits/new">Create a habit</ButtonLink> : undefined}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {t.activeHabits.map((habit) => {
            const l = lite.get(habit.id)!;
            const streak = habitStreak(l, t.habitDone, today);
            const rate = habitRate(l, t.habitDone, today);
            return (
              <li key={habit.id} className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold text-navy">{habit.title}</h2>
                    <p className="mt-0.5 text-sm text-ink-2">
                      {scheduleLabel(habit.schedule)}
                      {habit.schedule.kind === "weekly_target" && ` · ${weekCount(habit.id, t.habitDone, today)} so far this week`}
                    </p>
                  </div>
                  {streak.count >= 2 && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-xs font-bold text-gold-deep">
                      <Flame size={13} aria-hidden="true" />
                      {streak.count} {streak.unit === "week" ? "wk" : "d"}
                    </span>
                  )}
                </div>
                {habit.description && <p className="mt-2 line-clamp-2 text-sm text-ink-2 [overflow-wrap:anywhere]">{habit.description}</p>}

                <div className="mt-4 flex items-center gap-1" role="img" aria-label="Last 14 days">
                  {last14.map((date) => {
                    const done = t.habitDone.has(doneKey(habit.id, date));
                    return <span key={date} title={`${formatKey(date)}${done ? ": done" : ""}`} className="heat !w-[18px]" data-level={done ? 4 : date < l.startKey ? undefined : 0} />;
                  })}
                </div>
                <p className="mt-2 text-xs text-ink-3">{rate === null ? "Last 14 days" : `Last 14 days · ${rate}% of the past 30`}</p>

                <div className="mt-4 flex flex-wrap items-start gap-1 border-t border-line pt-3">
                  <Link href={`/habits/${habit.id}/edit`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-navy hover:bg-cream-deep">
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Link>
                  <ActionButton
                    action={archiveHabitAction}
                    id={habit.id}
                    label="Archive"
                    pendingLabel="Archiving…"
                    disabled={!canArchive}
                    disabledNote="Archive is full. Delete or restore an archived habit first."
                  />
                  <span className="ml-auto">
                    <ConfirmForm action={deleteHabitAction} id={habit.id} confirmLabel="Delete forever" />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && <ArchivedList habits={archived} canRestore={canCreate} />}
    </div>
  );
}

function ArchivedList({ habits, canRestore }: { habits: Habit[]; canRestore: boolean }) {
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-white/70 p-5" open={!canRestore}>
      <summary className="cursor-pointer font-display text-lg font-semibold text-navy">Archived ({habits.length})</summary>
      <p className="mt-2 text-sm text-ink-2">
        Archived habits keep all their history but no longer appear on Today.
        {!canRestore && " Your active habits are full, so archive or delete one before restoring."}
      </p>
      <ul className="mt-3 divide-y divide-line">
        {habits.map((h) => (
          <li key={h.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2.5">
            <span className="min-w-0 max-w-full truncate py-2 font-medium text-navy">{h.title}</span>
            <div className="flex shrink-0 items-start">
              <ActionButton
                action={archiveHabitAction}
                id={h.id}
                label="Restore"
                pendingLabel="Restoring…"
                restore
                disabled={!canRestore}
              />
              <ConfirmForm action={deleteHabitAction} id={h.id} confirmLabel="Delete forever" />
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
