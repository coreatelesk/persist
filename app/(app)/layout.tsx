import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { TimezoneSync } from "@/components/timezone-sync";
import { getIsAdmin, getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Everything here depends on the signed-in user, so never prerender it.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <AppShell email={session.user.email} isAdmin={await getIsAdmin()}>
      <TimezoneSync />
      {children}
    </AppShell>
  );
}
