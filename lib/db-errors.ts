import { isLimitKind, limitReachedMessage } from "@/lib/limit-messages";

type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Turns a Supabase/Postgres error into something a person (or the developer
 * setting the app up) can act on, and logs the original for the server console.
 * Raw database text is never returned to the browser.
 */
export function friendlyDbError(error: DbError, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const message = (error.message ?? "").toLowerCase();

  const limit = /limit_reached:([a-z_]+):(\d+)/.exec(error.message ?? "");
  if (limit && isLimitKind(limit[1])) return limitReachedMessage(limit[1], limit[2]);

  console.error("[persist] database error", error.code, error.message);

  if (message.includes("forbidden")) return "You don't have permission to do that.";
  if (message.includes("row-level security")) {
    return "Your session can't save this. Sign out, sign back in, and try again.";
  }
  if (error.code === "42501" || message.includes("permission denied")) {
    return "The database isn't fully set up yet. Run every file in supabase/migrations (see the README), then try again.";
  }
  if (["42P01", "42883", "PGRST202", "PGRST205", "PGRST204", "42703"].includes(error.code ?? "")) {
    return "The database tables are missing or out of date. Run every file in supabase/migrations (see the README), then try again.";
  }
  if (error.code === "23514") return "One of the values isn't allowed. Check the form and try again.";
  if (error.code === "23505") return "That already exists.";
  if (message.includes("jwt") || message.includes("not_authenticated") || message.includes("not authenticated")) {
    return "Your session has expired. Sign in again to continue.";
  }
  return fallback;
}
