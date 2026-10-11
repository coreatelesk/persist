import { APP_NAME } from "@/lib/brand";
import { BrandMark } from "./brand";

export function SetupNotice() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-line bg-white p-7">
        <BrandMark className="size-11" />
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">Connect Supabase to continue</h1>
        <p className="mt-2 text-ink-2">
          {APP_NAME} needs two environment variables before anyone can sign in. Add them to <code className="rounded bg-cream px-1.5 py-0.5 text-sm">.env.local</code>{" "}
          (or your hosting dashboard) and restart.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-navy p-4 text-sm leading-6 text-white/90">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
        <p className="mt-4 text-sm text-ink-2">You&apos;ll find both in Supabase under Project Settings, then API Keys. The README walks through the full setup.</p>
      </div>
    </main>
  );
}
