import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Heatmap, HeatmapLegend } from "@/components/heatmap";
import { LegalFooter } from "@/components/legal-footer";
import { ButtonLink } from "@/components/ui/button-link";
import { getSession } from "@/lib/auth/session";
import { APP_NAME, taglineLines } from "@/lib/brand";
import { sampleDays } from "@/lib/sample";
import { getToday } from "@/lib/tz";

export default async function Home({ searchParams }: { searchParams: Promise<{ account_deleted?: string }> }) {
  const params = await searchParams;
  if (await getSession()) redirect("/dashboard");
  const { today } = await getToday();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand href="/" />
        <ButtonLink href="/login" variant="quiet" className="min-h-10">
          Sign in
        </ButtonLink>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pt-20">
        {params.account_deleted === "1" && (
          <p role="status" className="mb-8 max-w-xl rounded-xl bg-moss-tint px-4 py-3 text-sm font-medium text-moss-deep">
            Your account and its data have been deleted. Thanks for trying {APP_NAME}.
          </p>
        )}
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.02] text-navy sm:text-7xl">
          {taglineLines().map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-ink-2">
          {APP_NAME} is a quiet place to track habits and challenges. Check off what you did today, and watch every day you
          showed up add to a record you can see.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login" className="min-h-12 px-7 text-base">
            Start tracking
          </ButtonLink>
        </div>

        <section aria-label="Example consistency graph" className="mt-14 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">Your year, at a glance</h2>
              <p className="mt-1 text-sm text-ink-2">An example. Darker days mean more of your plan got done.</p>
            </div>
            <HeatmapLegend />
          </div>
          <div className="mt-6">
            <Heatmap days={sampleDays(today, 48)} today={today} linkToHistory={false} />
          </div>
        </section>

        <ul className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            ["Know today at a glance", "Open the app and see exactly what's left. One tap marks it done."],
            ["Run focused challenges", "Give a stretch of effort a start, an end, and a goal you can finish."],
            ["Keep the receipts", "Every check-in is saved, so your history shows what you actually did."],
          ].map(([title, body]) => (
            <li key={title}>
              <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-ink-2">{body}</p>
            </li>
          ))}
        </ul>
      </main>
      <LegalFooter className="mx-auto max-w-6xl px-5 pb-10 sm:px-8" />
    </div>
  );
}
