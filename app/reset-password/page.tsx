import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!(await getSession())) redirect("/login?error=Open%20the%20reset%20link%20from%20your%20email%20to%20continue.");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Brand />
      <div className="flex flex-1 flex-col justify-center pb-16">
        <h1 className="font-display text-3xl font-bold text-navy">Choose a new password</h1>
        <p className="mt-2 text-ink-2">You&apos;ll be signed in as soon as you save it.</p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
