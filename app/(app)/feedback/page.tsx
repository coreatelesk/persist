import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "@/components/feedback-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES, type FeedbackCategory, type FeedbackStatus } from "@/lib/feedback";
import { formatChangelogDate } from "@/lib/changelog";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Feedback" };

type Row = { id: string; category: FeedbackCategory; message: string; status: FeedbackStatus; admin_note: string | null; created_at: string };

export default async function FeedbackPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("feedback")
    .select("id,category,message,status,admin_note,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const items = (data ?? []) as Row[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Share your ideas"
        description={`${APP_NAME} is shaped by the people who use it. Ask for a feature, suggest an improvement, or report something that's broken.`}
      />

      <Card>
        <FeedbackForm />
      </Card>

      <Card>
        <CardTitle hint="Everything you've sent, and where it stands.">Your suggestions</CardTitle>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-2">Nothing yet. Your first idea could be the next update.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {items.map((f) => (
              <li key={f.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[f.status]}`}>{STATUS_LABELS[f.status]}</span>
                  <span className="text-sm font-medium text-ink-2">{CATEGORY_LABELS[f.category]}</span>
                  <time dateTime={f.created_at} className="text-sm text-ink-3">
                    {formatChangelogDate(f.created_at.slice(0, 10))}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-navy [overflow-wrap:anywhere]">{f.message}</p>
                {f.admin_note && (
                  <p className="mt-2.5 rounded-xl bg-teal-tint px-3.5 py-2.5 text-sm text-navy [overflow-wrap:anywhere]">
                    <span className="font-semibold">Reply from the team: </span>
                    {f.admin_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
