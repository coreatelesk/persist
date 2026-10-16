import { NextResponse } from "next/server";
import { getProfile, getSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";
import { toCsv } from "@/lib/csv";
import { getEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(build: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await build(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

/**
 * Downloads everything the signed-in user has stored, as JSON (complete) or CSV (check-ins).
 * Uses the user's own session, so database row-level security guarantees it only ever
 * contains that person's records.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });
  const { supabase, user } = session;
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";

  try {
    const [habits, challenges, habitCheckins, challengeCheckins, feedback, profile, ent] = await Promise.all([
      fetchAll<Record<string, unknown>>((a, b) =>
        supabase.from("habits").select("id,title,description,schedule,created_at,archived_at").order("created_at").order("id").range(a, b),
      ),
      fetchAll<Record<string, unknown>>((a, b) =>
        supabase.from("challenges").select("id,title,description,starts_on,ends_on,target_days,status,completed_at,created_at").order("created_at").order("id").range(a, b),
      ),
      fetchAll<{ habit_id: string; completed_on: string; created_at: string }>((a, b) =>
        supabase.from("habit_completions").select("habit_id,completed_on,created_at").order("completed_on").order("id").range(a, b),
      ),
      fetchAll<{ challenge_id: string; completed_on: string; created_at: string }>((a, b) =>
        supabase.from("challenge_completions").select("challenge_id,completed_on,created_at").order("completed_on").order("id").range(a, b),
      ),
      fetchAll<Record<string, unknown>>((a, b) =>
        supabase.from("feedback").select("category,message,status,admin_note,created_at").order("created_at").order("id").range(a, b),
      ),
      getProfile(),
      getEntitlements(supabase),
    ]);

    const slug = APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export";
    const stamp = new Date().toISOString().slice(0, 10);
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };

    if (format === "csv") {
      const habitNames = new Map(habits.map((h) => [h.id as string, h.title as string]));
      const challengeNames = new Map(challenges.map((c) => [c.id as string, c.title as string]));
      const rows: unknown[][] = [["type", "name", "date_completed", "recorded_at"]];
      for (const c of habitCheckins) rows.push(["habit", habitNames.get(c.habit_id) ?? "", c.completed_on, c.created_at]);
      for (const c of challengeCheckins) rows.push(["challenge", challengeNames.get(c.challenge_id) ?? "", c.completed_on, c.created_at]);
      return new NextResponse("\uFEFF" + toCsv(rows), {
        headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}-check-ins-${stamp}.csv"` },
      });
    }

    const body = {
      exported_at: new Date().toISOString(),
      app: APP_NAME,
      account: {
        email: user.email ?? null,
        name: profile?.displayName ?? null,
        mobile_number: profile?.mobileNumber ?? null,
        plan: ent.planName,
      },
      habits,
      habit_check_ins: habitCheckins,
      challenges,
      challenge_check_ins: challengeCheckins,
      feedback,
    };
    return new NextResponse(JSON.stringify(body, null, 2), {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}-export-${stamp}.json"` },
    });
  } catch (error) {
    console.error("[persist] export failed", error);
    return NextResponse.json({ error: "We couldn't prepare your export. Please try again." }, { status: 500 });
  }
}
