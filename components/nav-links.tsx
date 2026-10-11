"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Flag, LayoutDashboard, Repeat2 } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Repeat2 },
  { href: "/challenges", label: "Challenges", icon: Flag },
  { href: "/history", label: "History", icon: CalendarDays },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="mt-10 space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium transition ${
              active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
            {label}
            {active && <span className="ml-auto size-1.5 rounded-full bg-gold" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              active ? "text-navy" : "text-ink-3"
            }`}
          >
            {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gold" aria-hidden="true" />}
            <Icon size={21} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
