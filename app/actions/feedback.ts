"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import { feedbackSchema, feedbackUpdateSchema, fieldErrors } from "@/lib/validation";

export async function submitFeedbackAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    category: formData.get("category") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category: parsed.data.category,
    message: parsed.data.message,
  });
  if (error) return { error: friendlyDbError(error, "We couldn't send that right now. Please try again.") };

  revalidatePath("/feedback");
  return { ok: true, message: "Thank you! Your feedback is with the team. You can follow its status below." };
}

/** Admin only: set a status and an optional public reply. The database re-checks the admin role. */
export async function updateFeedbackAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = feedbackUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };

  const { error } = await supabase.rpc("admin_feedback_update", {
    p_id: parsed.data.id,
    p_status: parsed.data.status,
    p_note: parsed.data.note || null,
  });
  if (error) return { error: friendlyDbError(error, "We couldn't save that update.") };

  revalidatePath("/admin/feedback");
  revalidatePath("/admin");
  revalidatePath("/feedback");
  return { ok: true, message: "Saved" };
}
