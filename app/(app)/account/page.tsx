import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download } from "lucide-react";
import { AccountForm } from "@/components/account-form";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getProfile, requireUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/entitlements";
import type { LimitKind } from "@/lib/limit-messages";

export const metadata: Metadata = { title: "Account" };

const ROWS: { label: string; active: LimitKind; archived: LimitKind }[] = [
  { label: "Habits", active: "active_habits", archived: "archived_habits" },
  { label: "Challenges", active: "active_challenges", archived: "archived_challenges" },
];

export default async function AccountPage() {
  const { supabase, user } = await requireUser();
  const [profile, ent] = await Promise.all([getProfile(), getEntitlements(supabase)]);
  const fmt = (used: number, cap: number | null) => (cap === null ? `${used}` : `${used} of ${cap}`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account" description="Your details and plan." />

      <Card>
        <CardTitle>Your details</CardTitle>
        <div className="mt-5">
          <AccountForm email={user.email ?? ""} displayName={profile?.displayName ?? ""} mobile={profile?.mobileNumber ?? ""} />
        </div>
      </Card>

      <Card>
        <CardTitle hint="What you can have at the same time on your plan.">{ent.planName} plan</CardTitle>
        <dl className="mt-4 divide-y divide-line text-sm">
          {ROWS.map((r) => (
            <div key={r.label} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 sm:grid-cols-[8rem_1fr_1fr]">
              <dt className="font-semibold text-navy">{r.label}</dt>
              <dd className="text-ink-2 sm:order-none">
                Active: <span className="font-semibold text-navy tabular-nums">{fmt(ent.usage[r.active], ent.limits[r.active])}</span>
              </dd>
              <dd className="col-span-2 text-ink-2 sm:col-span-1">
                Archived: <span className="font-semibold text-navy tabular-nums">{fmt(ent.usage[r.archived], ent.limits[r.archived])}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardTitle hint="Your habits, challenges and check-ins belong to you. Download a copy any time.">Your data</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/account/export?format=json"
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-5 text-sm font-semibold text-navy hover:bg-cream-deep"
          >
            <Download size={16} aria-hidden="true" /> Download everything (JSON)
          </a>
          <a
            href="/account/export?format=csv"
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-5 text-sm font-semibold text-navy hover:bg-cream-deep"
          >
            <Download size={16} aria-hidden="true" /> Check-ins for spreadsheets (CSV)
          </a>
        </div>
      </Card>

      <Card>
        <CardTitle>Help and policies</CardTitle>
        <ul className="mt-3 divide-y divide-line">
          {[
            ["/feedback", "Share an idea or report a problem"],
            ["/support", "Contact support"],
            ["/privacy", "Privacy Policy"],
            ["/terms", "Terms of Service"],
            ["/cookies", "Advertising and cookies"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="flex min-h-12 items-center justify-between rounded-lg text-[15px] font-medium text-navy hover:text-teal">
                {label}
                <ChevronRight size={18} className="text-ink-3" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-danger/30">
        <CardTitle hint="Permanently remove your account and everything in it.">Delete account</CardTitle>
        <Link
          href="/account/delete"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-danger/40 px-5 text-sm font-semibold text-danger hover:bg-danger-tint"
        >
          Delete my account…
        </Link>
      </Card>
    </div>
  );
}
