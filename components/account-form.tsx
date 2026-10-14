"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/account";
import type { ActionState } from "@/lib/action-state";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function AccountForm({ email, displayName, mobile }: { email: string; displayName: string; mobile: string }) {
  // Controlled, because React resets uncontrolled fields after every submit, even a failed one.
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(mobile);
  const [state, formAction] = useActionState<ActionState, FormData>(updateProfileAction, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email" htmlFor="email" hint="Your sign-in email. It can't be changed here.">
        <input id="email" value={email} readOnly disabled className={`${inputClass} bg-cream text-ink-2`} />
      </Field>
      <Field label="Name" htmlFor="displayName" hint="Used to greet you on the Today page." error={errors.displayName}>
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-invalid={!!errors.displayName}
          className={inputClass}
        />
      </Field>
      <Field
        label="Mobile number (optional)"
        htmlFor="mobile"
        hint="Kept private. It isn't used to send messages today, and administrators can't see it in the dashboard."
        error={errors.mobile}
      >
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          aria-invalid={!!errors.mobile}
          className={inputClass}
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="rounded-xl bg-moss-tint px-4 py-3 text-sm font-medium text-moss-deep">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
