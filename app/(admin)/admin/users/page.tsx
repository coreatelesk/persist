import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/field";
import { PAGE_SIZE, USER_SORTS, loadUsers, timeAgo } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Users" };

const STATUS: Record<string, string> = {
  active: "bg-moss-tint text-moss-deep",
  unconfirmed: "bg-gold-tint text-gold-deep",
  suspended: "bg-danger-tint text-danger",
};

const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { rows, total, sort, page } = await loadUsers(supabase, { q: params.q, sort: params.sort, page: Number(params.page) || 1 });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (params.q) u.set("q", params.q);
    if (sort !== "created_desc") u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/users${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">Users</h1>
        <p className="mt-2 text-sm text-ink-2">
          {total.toLocaleString("en-IN")} {total === 1 ? "account" : "accounts"}
          {params.q ? ` matching “${params.q}”` : ""}. Contact numbers and habit content are not shown here.
        </p>
      </header>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search by email or name</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input name="q" defaultValue={params.q ?? ""} maxLength={100} placeholder="Search by email or name" className={`${inputClass} pl-11`} />
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select name="sort" defaultValue={sort} className={`${inputClass} sm:w-auto`}>
            {USER_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-12 rounded-xl bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-deep">Search</button>
      </form>

      <Card className="!p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-2">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-3">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Last active</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Habits</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Challenges</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Check-ins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((u) => (
                  <tr key={u.user_id}>
                    <td className="max-w-[16rem] px-5 py-3.5">
                      <p className="truncate font-semibold text-navy">{u.display_name || "No name"}</p>
                      <p className="truncate text-ink-2">{u.email}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[u.status] ?? ""}`}>{u.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-ink-2">{date(u.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-ink-2" title={u.last_active_at ?? undefined}>
                      {timeAgo(u.last_active_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right tabular-nums text-ink-2">
                      <span className="font-semibold text-navy">{u.active_habits}</span> active · {u.archived_habits} arch.
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-navy">{u.challenges}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-navy">{Number(u.checkins).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink-2">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={qs(page + 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-navy hover:bg-cream-deep">
              Next <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
