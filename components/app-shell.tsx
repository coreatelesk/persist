import Link from "next/link";
import { LogOut, Shield, UserRound } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Brand } from "./brand";
import { LegalFooter } from "./legal-footer";
import { BottomNav, SidebarNav } from "./nav-links";

function SignOut({ variant }: { variant: "sidebar" | "bar" }) {
  return (
    <form action={signOutAction}>
      <button
        className={
          variant === "sidebar"
            ? "flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
            : "grid size-11 place-items-center rounded-xl text-ink-2 hover:bg-cream-deep"
        }
        aria-label="Sign out"
      >
        <LogOut size={variant === "sidebar" ? 19 : 20} strokeWidth={1.8} aria-hidden="true" />
        {variant === "sidebar" && "Sign out"}
      </button>
    </form>
  );
}

export function AppShell({ email, isAdmin = false, children }: { email?: string | null; isAdmin?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-navy px-4 py-7 md:flex">
        <div className="px-1.5">
          <Brand tone="light" />
        </div>
        <SidebarNav isAdmin={isAdmin} />
        <div className="mt-auto space-y-1">
          {email && <p className="truncate px-3.5 pb-2 text-xs text-white/55">{email}</p>}
          <SignOut variant="sidebar" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <div className="py-2.5">
            <Brand />
          </div>
          <div className="flex items-center">
            {isAdmin && (
              <Link href="/admin" aria-label="Admin dashboard" className="grid size-11 place-items-center rounded-xl text-ink-2 hover:bg-cream-deep">
                <Shield size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            )}
            <Link href="/account" aria-label="Account" className="grid size-11 place-items-center rounded-xl text-ink-2 hover:bg-cream-deep">
              <UserRound size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <SignOut variant="bar" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-8 md:pb-16 md:pt-10 lg:px-10">{children}
          <LegalFooter variant="app" className="mt-12" />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
