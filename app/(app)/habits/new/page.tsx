import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HabitForm } from "@/components/habit-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getEntitlements, hasRoom } from "@/lib/entitlements";

export const metadata: Metadata = { title: "New habit" };

export default async function NewHabitPage() {
  const { supabase } = await requireUser();
  const ent = await getEntitlements(supabase);
  const canCreate = hasRoom(ent, "active_habits");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/habits" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Habits
      </Link>
      <PageHeader title="New habit" description="Keep it small and specific. You can change it any time." />
      {canCreate ? (
        <HabitForm />
      ) : (
        <div className="space-y-4">
          <Notice title={`You have ${ent.usage.active_habits} active habits, the limit on the ${ent.planName} plan`}>
            To add a new habit, archive or delete one you no longer need. Archiving keeps all of its history.
          </Notice>
          <ButtonLink href="/habits" variant="quiet">
            Manage my habits
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
