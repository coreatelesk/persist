import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CalendarCheck, Flag, MessageSquarePlus, Repeat2, UserMinus, UserPlus, Users } from "lucide-react";
import { TrendChart } from "@/components/admin/trend-chart";
import { Stat } from "@/components/stat";
import { Card, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { BUCKETS, RANGES, bucketLabel, eventLabel, loadOverview, loadRecentActivity, loadSeries, parseRange, timeAgo } from "@/lib/admin/data";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "Overview" };

const n = (v: number) => v.toLocaleString("en-IN");

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string; bucket?: string }> }) {
  const { supabase } = await requireAdmin();
  const { today, timeZone } = await getToday();
  const { range, bucket } = parseRange(await searchParams);

  const [o, series, recent] = await Promise.all([
    loadOverview(supabase, timeZone),
    loadSeries(supabase, today, range, bucket, timeZone),
    loadRecentActivity(supabase, 15),
  ]);

  const labels = series.map((p) => bucketLabel(p.bucket_start, bucket));
  const col = (k: "signups" | "active_users" | "checkins") => series.map((p) => p[k]);
  const created = series.map((p) => p.habits_created + p.challenges_created);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const per = bucket === "day" ? "day" : bucket === "week" ? "week" : "month";
  const href = (r: number, b: string) => `/admin?range=${r}&bucket=${b}`;
  const chip = (on: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition ${on ? "border-navy bg-navy text-white" : "border-line-strong bg-white text-navy hover:bg-cream-deep"}`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">Platform overview</h1>
        <p className="mt-2 text-sm text-ink-2">
          Live from the database · days follow {o.timezone} · updated {timeAgo(o.generated_at)}
        </p>
      </header>

      <section aria-label="Users" className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-navy">Users</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Users size={15} aria-hidden="true" />} label="Registered" value={n(o.users.total)} note={`${n(o.users.confirmed)} confirmed email`} />
          <Stat icon={<UserPlus size={15} aria-hidden="true" />} label="New, last 7 days" value={n(o.users.new_7d)} note={`Today ${n(o.users.new_today)} · 30 days ${n(o.users.new_30d)}`} />
          <Stat icon={<UserMinus size={15} aria-hidden="true" />} label="Never active" value={n(o.users.never_active)} note="Signed up, no activity yet" />
          <Stat icon={<Activity size={15} aria-hidden="true" />} label="Active, last 30 days" value={n(o.activity.mau)} note={`${o.users.total ? Math.round((o.activity.mau / o.users.total) * 100) : 0}% of all users`} accent />
        </div>
      </section>

      <section aria-label="Active users" className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-navy">Active users</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Activity size={15} aria-hidden="true" />} label="DAU today" value={n(o.activity.dau)} note={`Yesterday ${n(o.activity.dau_yesterday)}`} />
          <Stat icon={<Activity size={15} aria-hidden="true" />} label="WAU" value={n(o.activity.wau)} note="Last 7 days" />
          <Stat icon={<Activity size={15} aria-hidden="true" />} label="MAU" value={n(o.activity.mau)} note="Last 30 days" />
        </div>
        <p className="text-xs text-ink-3">
          A user counts as active only after meaningful activity: creating, editing, archiving or restoring a habit, managing a challenge, or completing a check-in. Having an account or opening a page doesn&apos;t count.
        </p>
      </section>

      <section aria-label="Content" className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-navy">Content and check-ins</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Repeat2 size={15} aria-hidden="true" />} label="Habits" value={n(o.habits.total)} note={`${n(o.habits.active)} active · ${n(o.habits.archived)} archived`} />
          <Stat icon={<Flag size={15} aria-hidden="true" />} label="Challenges" value={n(o.challenges.total)} note={`${n(o.challenges.active)} active · ${n(o.challenges.finished)} finished · ${n(o.challenges.archived)} archived`} />
          <Stat icon={<CalendarCheck size={15} aria-hidden="true" />} label="Check-ins" value={n(o.checkins.total)} note={`Today ${n(o.checkins.today)} · 7 days ${n(o.checkins.last_7d)} · 30 days ${n(o.checkins.last_30d)}`} />
          <Link href="/admin/feedback" aria-label="Open feedback inbox" className="block rounded-[var(--radius-card)] transition hover:shadow-sm">
            <Stat icon={<MessageSquarePlus size={15} aria-hidden="true" />} label="Feedback" value={n(o.feedback.new)} note={`new · ${n(o.feedback.total)} total · ${n(o.feedback.last_7d)} this week`} accent={o.feedback.new > 0} />
          </Link>
        </div>
      </section>

      <section aria-label="Trends" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-navy">Trends</h2>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <Link key={r.value} href={href(r.value, bucket)} aria-current={r.value === range ? "true" : undefined} className={chip(r.value === range)}>
                  {r.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Group by">
              {BUCKETS.map((b) => (
                <Link key={b} href={href(range, b)} aria-current={b === bucket ? "true" : undefined} className={chip(b === bucket)}>
                  By {b}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-ink-2">
          In this period: <strong className="text-navy">{n(sum(col("signups")))}</strong> new users ·{" "}
          <strong className="text-navy">{n(sum(col("checkins")))}</strong> check-ins ·{" "}
          <strong className="text-navy">{n(sum(created))}</strong> habits and challenges created
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card><TrendChart title={`New registrations per ${per}`} labels={labels} values={col("signups")} /></Card>
          <Card><TrendChart title={`Active users per ${per}`} labels={labels} values={col("active_users")} color="var(--color-teal)" /></Card>
          <Card><TrendChart title={`Check-ins per ${per}`} labels={labels} values={col("checkins")} /></Card>
          <Card><TrendChart title={`Habits and challenges created per ${per}`} labels={labels} values={created} color="var(--color-gold)" /></Card>
        </div>
      </section>

      <Card>
        <CardTitle hint="The latest actions across the platform. Shows what happened and who, never the names or notes of anyone's habits.">Recent activity</CardTitle>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-ink-2">No activity recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((e, i) => (
              <li key={`${e.created_at}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                <span className="min-w-0 text-[15px] text-navy">
                  <span className="font-semibold">{e.display_name || e.email || "Unknown user"}</span>
                  <span className="text-ink-2"> · {eventLabel(e.event)}</span>
                </span>
                <time dateTime={e.created_at} className="shrink-0 text-sm text-ink-3">
                  {timeAgo(e.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
