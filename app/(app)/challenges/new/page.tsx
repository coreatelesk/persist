import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChallengeForm } from "@/components/challenge-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { getEntitlements, hasRoom } from "@/lib/entitlements";
import { getToday } from "@/lib/tz";

export const metadata: Metadata = { title: "New challenge" };

export default async function NewChallengePage() {
  const { today } = await getToday();
  const { supabase } = await requireUser();
  const ent = await getEntitlements(supabase);
  const canCreate = hasRoom(ent, "active_challenges");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/challenges" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Challenges
      </Link>
      <PageHeader title="New challenge" description="Choose how long it runs and how many days you'll show up." />
      {canCreate ? (
        <ChallengeForm today={today} />
      ) : (
        <div className="space-y-4">
          <Notice title={`You have ${ent.usage.active_challenges} active challenges, the limit on the ${ent.planName} plan`}>
            To start a new one, finish, archive, or delete an existing challenge. Archiving keeps all of its check-ins.
          </Notice>
          <ButtonLink href="/challenges" variant="quiet">
            Manage my challenges
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
