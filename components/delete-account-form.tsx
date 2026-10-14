"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/app/actions/account";
import type { ActionState } from "@/lib/action-state";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteAccountForm({ email }: { email: string | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(deleteAccountAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <Field
        label={email ? "Type your account email to confirm" : "Type DELETE to confirm"}
        htmlFor="confirm"
        error={state.fieldErrors?.confirm}
      >
        <input
          id="confirm"
          name="confirm"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder={email ?? "DELETE"}
          aria-invalid={!!state.fieldErrors?.confirm}
          className={inputClass}
        />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton variant="danger" pendingLabel="Deleting your account…">
        Permanently delete my account
      </SubmitButton>
    </form>
  );
}
