import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HabitForm } from "@/components/habit-form";
import { Notice } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { loadUsage } from "@/lib/limits";

export const metadata: Metadata = { title: "New habit" };

export default async function NewHabitPage() {
  const { supabase } = await requireUser();
  const usage = await loadUsage(supabase);
  const atLimit = usage.habits.used >= usage.habits.limit;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/habits" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Habits
      </Link>
      <PageHeader title="New habit" description="Keep it small and specific. You can change it any time." />
      {atLimit ? (
        <Notice title={`You've created ${usage.habits.limit} habits this month`}>
          That&apos;s the monthly limit. You can create more on {usage.resetsOn}. Meanwhile, you can edit or archive existing habits.
        </Notice>
      ) : (
        <HabitForm />
      )}
    </div>
  );
}
