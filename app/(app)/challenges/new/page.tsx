import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenge-form";
import { Notice } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { loadUsage } from "@/lib/limits";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "New challenge" };

export default async function NewChallengePage() {
  const { today } = await getToday();
  const { supabase } = await requireUser();
  const usage = await loadUsage(supabase);
  const atLimit = usage.challenges.used >= usage.challenges.limit;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/challenges" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Challenges
      </Link>
      <PageHeader title="New challenge" description="Choose how long it runs and how many days you'll show up." />
      {atLimit ? (
        <Notice title={`You've started ${usage.challenges.limit} challenges this month`}>
          That&apos;s the monthly limit. You can start another on {usage.resetsOn}.
        </Notice>
      ) : (
        <ChallengeForm today={today} />
      )}
    </div>
  );
}
