import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/brand";
import { TimezoneSync } from "@/components/timezone-sync";
import { requireAdmin } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: `%s · Admin · ${APP_NAME}` }, robots: { index: false, follow: false } };

// No ads and no user-app chrome here. Every page also calls requireAdmin(); layouts are not
// re-run on client-side navigation, and the database re-checks the role on every query anyway.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh">
      <TimezoneSync />
      <header className="sticky top-0 z-20 bg-navy pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="size-8" />
            <span className="font-display text-lg font-bold text-white">{APP_NAME}</span>
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-navy-deep">Admin</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <AdminNav />
            <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              Back to app
            </Link>
            <form action={signOutAction}>
              <button aria-label="Sign out" className="grid size-10 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
                <LogOut size={18} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-8">{children}</main>
    </div>
  );
}
