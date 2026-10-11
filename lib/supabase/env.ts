/**
 * Reads the public Supabase settings. Accepts either the newer "publishable"
 * key or the legacy "anon" key. Each variable is referenced literally so that
 * Next.js can inline it into the browser bundle.
 */
function clean(value: string | undefined) {
  const v = value?.trim();
  return v && !v.startsWith("YOUR_") ? v : undefined;
}

export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key || !/^https?:\/\//.test(url)) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }
  return env;
}
