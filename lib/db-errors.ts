type DbError = { code?: string; message?: string } | null | undefined;

/**
 * Turns a Supabase/Postgres error into something a person (or the developer
 * setting the app up) can act on, and logs the original for the server console.
 */
export function friendlyDbError(error: DbError, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  const limit = /limit_reached:(habits|challenges):(\d+)/.exec(error.message ?? "");
  if (limit) {
    const what = limit[1] === "habits" ? "habits" : "challenges";
    return `You've reached this month's limit of ${limit[2]} new ${what}. The allowance resets on the 1st.`;
  }
  console.error("[persist] database error", error.code, error.message);
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("row-level security")) {
    return "Your session can't save this. Sign out, sign back in, and try again.";
  }
  if (error.code === "42501" || message.includes("permission denied")) {
    return "The database isn't fully set up yet. Run every file in supabase/migrations (see the README), then try again.";
  }
  if (["42P01", "PGRST205", "PGRST204", "42703"].includes(error.code ?? "")) {
    return "The database tables are missing or out of date. Run every file in supabase/migrations (see the README), then try again.";
  }
  if (error.code === "23514") return "One of the values isn't allowed. Check the form and try again.";
  if (error.code === "23505") return "That already exists.";
  if (message.includes("jwt") || message.includes("not authenticated")) {
    return "Your session has expired. Sign in again to continue.";
  }
  return fallback;
}
