import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Delete account" };

export default async function DeleteAccountPage() {
  const { user } = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/account" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Account
      </Link>
      <PageHeader title="Delete your account" description={`This permanently removes your ${APP_NAME} account.`} />

      <Card>
        <h2 className="font-display text-lg font-semibold text-navy">What will happen</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-ink-2">
          <li>Your sign-in, profile (name and mobile number), habits, challenges, check-ins, and history are deleted.</li>
          <li>Records of your activity on the service are deleted with them.</li>
          <li>You&apos;ll be signed out everywhere, and you can&apos;t get this data back.</li>
          <li>Backups kept by our database provider may hold a copy for a limited time before they expire.</li>
        </ul>
        <p className="mt-4 text-[15px] text-ink-2">
          If you only want a fresh start, you can archive or delete individual habits and challenges instead. There&apos;s no data export yet
          {SITE.supportEmail ? (
            <>
              ; to ask for a copy first, <a className="font-semibold text-teal underline underline-offset-4" href={`mailto:${SITE.supportEmail}`}>contact support</a>.
            </>
          ) : (
            "."
          )}
        </p>
      </Card>

      <Card className="border-danger/30">
        <DeleteAccountForm email={user.email ?? null} />
      </Card>
    </div>
  );
}
