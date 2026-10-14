"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/action-state";
import { addDays } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";
import { getToday } from "@/lib/tz";
import { challengeSchema, fieldErrors, idSchema } from "@/lib/validation";

function refresh() {
  revalidatePath("/", "layout");
}

export async function createChallengeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const duration = Number(formData.get("durationDays"));
  const rawTarget = String(formData.get("targetDays") ?? "").trim();
  const parsed = challengeSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    startsOn: formData.get("startsOn") ?? "",
    durationDays: duration,
    // An empty goal means "every day".
    targetDays: rawTarget === "" ? duration : Number(rawTarget),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      starts_on: parsed.data.startsOn,
      ends_on: addDays(parsed.data.startsOn, parsed.data.durationDays - 1),
      target_days: parsed.data.targetDays,
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyDbError(error, "We couldn't create that challenge. Please try again.") };

  refresh();
  redirect(`/challenges/${data.id}`);
}

/** Archives or restores a challenge. The database enforces the active and archived limits. */
export async function archiveChallengeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "That challenge couldn't be found." };
  const restore = formData.get("restore") === "1";
  const { supabase, user } = await requireUser();

  let status = "archived";
  if (restore) {
    const { data, error } = await supabase
      .from("challenges")
      .select("ends_on,completed_at,status")
      .eq("id", id.data)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return { error: friendlyDbError(error, "We couldn't restore that challenge.") };
    if (!data) return { error: "That challenge couldn't be found." };
    const { today } = await getToday();
    // Bring it back to where it was: finished challenges stay finished, running ones become active again.
    status = data.completed_at ? "completed" : today > data.ends_on ? "ended" : "active";
  }

  // Archiving works from any non-archived status; restoring only from archived.
  const query = supabase.from("challenges").update({ status }).eq("id", id.data).eq("user_id", user.id);
  const { error } = await (restore ? query.eq("status", "archived") : query.neq("status", "archived"));
  if (error) return { error: friendlyDbError(error, restore ? "We couldn't restore that challenge." : "We couldn't archive that challenge.") };
  refresh();
  return { ok: true };
}

export async function endChallengeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "That challenge couldn't be found." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("challenges")
    .update({ status: "ended" })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) return { error: friendlyDbError(error, "We couldn't end that challenge.") };
  refresh();
  return { ok: true };
}

export async function deleteChallengeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "That challenge couldn't be found." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("challenges").delete().eq("id", id.data).eq("user_id", user.id);
  if (error) return { error: friendlyDbError(error, "We couldn't delete that challenge.") };
  refresh();
  if (formData.get("redirect") === "1") redirect("/challenges");
  return { ok: true };
}
