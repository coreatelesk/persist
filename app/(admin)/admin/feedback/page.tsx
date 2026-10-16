import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackRowForm } from "@/components/admin/feedback-row";
import { Card } from "@/components/ui/card";
import { PAGE_SIZE, loadFeedback, timeAgo } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/session";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES, type FeedbackCategory, type FeedbackStatus } from "@/lib/feedback";

export const metadata: Metadata = { title: "Feedback" };

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewing", label: "Under review" },
  { key: "planned", label: "Planned" },
  { key: "done", label: "Shipped" },
  { key: "declined", label: "Not planned" },
];

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { rows, total, counts, status, category, page } = await loadFeedback(supabase, { status: params.status, category: params.category, page: Number(params.page) || 1 });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: { status?: string | null; category?: string | null; page?: number }) => {
    const u = new URLSearchParams();
    const s = over.status === undefined ? status : over.status;
    const c = over.category === undefined ? category : over.category;
    if (s) u.set("status", s);
    if (c) u.set("category", c);
    if (over.page && over.page > 1) u.set("page", String(over.page));
    const q = u.toString();
    return `/admin/feedback${q ? `?${q}` : ""}`;
  };
  const count = (key: string) => (key === "" ? counts.total : counts[key as keyof typeof counts]);
  const chip = (on: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${on ? "border-navy bg-navy text-white" : "border-line-strong bg-white text-navy hover:bg-cream-deep"}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">Feedback</h1>
        <p className="mt-2 text-sm text-ink-2">
          Ideas, improvements and bug reports from users. Statuses and replies are visible to the person who sent each one.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {TABS.map((t) => (
          <Link key={t.key} href={href({ status: t.key || null, page: 1 })} aria-current={(status ?? "") === t.key ? "true" : undefined} className={chip((status ?? "") === t.key)}>
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${(status ?? "") === t.key ? "bg-white/20" : "bg-cream-deep text-ink-2"}`}>{count(t.key)}</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {[{ key: "", label: "Any type" }, ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }))].map((c) => (
          <Link key={c.key} href={href({ category: c.key || null, page: 1 })} aria-current={(category ?? "") === c.key ? "true" : undefined} className={chip((category ?? "") === c.key)}>
            {c.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-ink-2">{counts.total === 0 ? "No feedback has been sent yet." : "Nothing matches these filters."}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((f) => (
            <li key={f.id}>
              <Card as="article">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[f.status as FeedbackStatus]}`}>{STATUS_LABELS[f.status as FeedbackStatus]}</span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-2">{CATEGORY_LABELS[f.category as FeedbackCategory]}</span>
                  <time dateTime={f.created_at} className="text-sm text-ink-3">
                    {timeAgo(f.created_at)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-navy [overflow-wrap:anywhere]">{f.message}</p>
                <p className="mt-3 text-sm text-ink-2">
                  From <span className="font-semibold text-navy">{f.display_name || "No name"}</span> · {f.email}
                </p>
                <FeedbackRowForm id={f.id} status={f.status} note={f.admin_note ?? ""} />
              </Card>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink-2">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
              Next <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
