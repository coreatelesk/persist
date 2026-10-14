import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Verified user for this request (cached so layout + page share one auth call). */
export const getSession = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Whether the signed-in user is an administrator. The database decides; this is only a lookup. */
export const getIsAdmin = cache(async () => {
  const session = await getSession();
  if (!session) return false;
  const { data, error } = await session.supabase.rpc("is_admin");
  return !error && data === true;
});

/**
 * Guard for every admin page. Visitors who are not administrators get a plain 404 so the
 * existence of the admin area isn't advertised. The database functions re-check the role
 * on every query, so this is a second layer, not the only one.
 */
export async function requireAdmin() {
  const session = await requireUser();
  if (!(await getIsAdmin())) notFound();
  return session;
}

/** The signed-in user's own profile row (display name, optional mobile number). */
export const getProfile = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const { data } = await session.supabase
    .from("profiles")
    .select("display_name,mobile_number")
    .eq("id", session.user.id)
    .maybeSingle();
  return { displayName: (data?.display_name as string | null) ?? null, mobileNumber: (data?.mobile_number as string | null) ?? null };
});
