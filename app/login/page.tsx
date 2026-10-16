import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { LegalFooter } from "@/components/legal-footer";
import { Heatmap } from "@/components/heatmap";
import { SetupNotice } from "@/components/setup-notice";
import { getSession } from "@/lib/auth/session";
import { APP_TAGLINE } from "@/lib/brand";
import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getToday } from "@/lib/tz";
import { sampleDays } from "@/lib/sample";

export const metadata: Metadata = { title: "Sign in" };

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  if (await getSession()) redirect("/dashboard");

  const params = await searchParams;
  const next = safeNext(params.next);
  const { today } = await getToday();
  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex min-h-dvh flex-col px-5 py-8 sm:px-10">
        <Brand href="/" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {params.error && (
            <p role="alert" className="mb-5 rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
              {params.error}
            </p>
          )}
          <AuthForm next={next} googleEnabled={googleEnabled} initialMode={params.mode === "signup" ? "signup" : "signin"} />
        </div>
        <LegalFooter variant="app" className="mt-4" />
      </section>

      <aside className="hidden flex-col justify-center overflow-hidden bg-navy px-12 text-white lg:flex">
        <h2 className="max-w-md font-display text-5xl font-bold leading-[1.05]">{APP_TAGLINE}</h2>
        <p className="mt-5 max-w-md text-lg text-white/70">
          Check off today&apos;s habits in seconds. Watch every day you showed up add to the picture.
        </p>
        <div className="mt-12 max-w-full rounded-2xl bg-white p-5">
          <Heatmap days={sampleDays(today, 26)} today={today} linkToHistory={false} />
        </div>
      </aside>
    </main>
  );
}
