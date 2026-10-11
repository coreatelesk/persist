"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/action-state";
import { addDays } from "@/lib/dates";
import { friendlyDbError } from "@/lib/db-errors";
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

export async function endChallengeAction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("challenges")
    .update({ status: "ended" })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) friendlyDbError(error);
  refresh();
}

export async function deleteChallengeAction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("challenges").delete().eq("id", id.data).eq("user_id", user.id);
  if (error) {
    friendlyDbError(error);
    return;
  }
  refresh();
  redirect("/challenges");
}
