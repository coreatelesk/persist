import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HabitForm } from "@/components/habit-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { normalizeSchedule } from "@/lib/tracking/schedule";
import { idSchema } from "@/lib/validation";
import type { Habit } from "@/lib/tracking/types";

export const metadata: Metadata = { title: "Edit habit" };

export default async function EditHabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("habits")
    .select("id,title,description,schedule,created_at,archived_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const habit: Habit = { ...data, schedule: normalizeSchedule(data.schedule) };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/habits" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Habits
      </Link>
      <PageHeader title="Edit habit" />
      <HabitForm habit={habit} />
    </div>
  );
}
