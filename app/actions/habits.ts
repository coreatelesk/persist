"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, habitSchema, idSchema } from "@/lib/validation";

function readHabitForm(formData: FormData) {
  return habitSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    kind: formData.get("kind") ?? "daily",
    days: formData.getAll("days").map(Number),
    target: Number(formData.get("target") ?? 3),
  });
}

function toSchedule(input: { kind: string; days: number[]; target: number }) {
  if (input.kind === "custom") return { kind: "custom", days: [...new Set(input.days)].sort() };
  if (input.kind === "weekly_target") return { kind: "weekly_target", target: input.target };
  return { kind: input.kind };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createHabitAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = readHabitForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    schedule: toSchedule(parsed.data),
  });
  if (error) return { error: friendlyDbError(error, "We couldn't save that habit. Please try again.") };

  refresh();
  redirect("/habits");
}

export async function updateHabitAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!idSchema.safeParse(id).success) return { error: "That habit couldn't be found." };
  const parsed = readHabitForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habits")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      schedule: toSchedule(parsed.data),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: friendlyDbError(error, "We couldn't save your changes. Please try again.") };

  refresh();
  redirect("/habits");
}

export async function archiveHabitAction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const restore = formData.get("restore") === "1";
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) friendlyDbError(error);
  refresh();
}

export async function deleteHabitAction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("habits").delete().eq("id", id.data).eq("user_id", user.id);
  if (error) friendlyDbError(error);
  refresh();
}
