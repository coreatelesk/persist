"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addDays, todayIn } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";
import { getTimeZone } from "@/lib/tz";
import { checkinSchema } from "@/lib/validation";

export type CheckinResult = { ok: true } | { ok: false; error: string };

type CheckinInput = { kind: "habit" | "challenge"; id: string; date: string; done: boolean };

/** Sets a check-in to done or not done. Idempotent, so double taps are harmless. */
export async function setCheckinAction(input: CheckinInput): Promise<CheckinResult> {
  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That check-in wasn't valid." };
  const { kind, id, date, done } = parsed.data;

  // Only today (give or take a day for time-zone edges) can be checked in.
  const today = todayIn(await getTimeZone());
  if (date < addDays(today, -1) || date > addDays(today, 1)) {
    return { ok: false, error: "You can only check in for today." };
  }

  const { supabase, user } = await requireUser();

  if (kind === "habit") {
    const { error } = done
      ? await supabase
          .from("habit_completions")
          .upsert(
            { habit_id: id, user_id: user.id, completed_on: date },
            { onConflict: "habit_id,completed_on", ignoreDuplicates: true },
          )
      : await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", id)
          .eq("user_id", user.id)
          .eq("completed_on", date);
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save that check-in.") };
  } else {
    const { error } = done
      ? await supabase
          .from("challenge_completions")
          .upsert(
            { challenge_id: id, user_id: user.id, completed_on: date },
            { onConflict: "challenge_id,completed_on", ignoreDuplicates: true },
          )
      : await supabase
          .from("challenge_completions")
          .delete()
          .eq("challenge_id", id)
          .eq("user_id", user.id)
          .eq("completed_on", date);
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save that check-in.") };

    // Finishing the goal completes the challenge; undoing a check-in reopens it.
    const [{ data: challenge }, { count }] = await Promise.all([
      supabase.from("challenges").select("status,target_days").eq("id", id).maybeSingle(),
      supabase.from("challenge_completions").select("id", { count: "exact", head: true }).eq("challenge_id", id),
    ]);
    if (challenge && count !== null) {
      const reached = count >= challenge.target_days;
      if (reached && challenge.status === "active") {
        await supabase.from("challenges").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      } else if (!reached && challenge.status === "completed") {
        await supabase.from("challenges").update({ status: "active", completed_at: null }).eq("id", id);
      }
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
