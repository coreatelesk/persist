"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/action-state";
import { friendlyDbError } from "@/lib/db-errors";
import { fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    mobile: formData.get("mobile") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await requireUser();
  const values = {
    display_name: parsed.data.displayName || null,
    mobile_number: parsed.data.mobile || null,
  };

  const { data, error } = await supabase.from("profiles").update(values).eq("id", user.id).select("id");
  if (error) return { error: friendlyDbError(error, "We couldn't save your details. Please try again.") };

  // Accounts created before profiles existed may not have a row yet.
  if (!data || data.length === 0) {
    const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, ...values });
    if (insertError) return { error: friendlyDbError(insertError, "We couldn't save your details. Please try again.") };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Your details are saved." };
}

/**
 * Permanently deletes the signed-in user's own account. The database function deletes
 * only auth.uid(), so there is no way to name another account. The person must also type
 * their account email to confirm.
 */
export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const expected = (user.email ?? "DELETE").trim().toLowerCase();
  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (typed !== expected) {
    return { fieldErrors: { confirm: user.email ? "That doesn't match your account email." : "Type DELETE to confirm." } };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: friendlyDbError(error, "We couldn't delete your account. Please try again or contact support.") };

  try {
    await supabase.auth.signOut();
  } catch {
    // The account is gone; the session cookie is cleared best-effort.
  }
  redirect("/?account_deleted=1");
}
