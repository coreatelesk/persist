"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { Field, inputClass } from "@/components/ui/field";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; button: string }> = {
  signin: { title: "Welcome back", button: "Sign in" },
  signup: { title: "Create your account", button: "Create account" },
  forgot: { title: "Reset your password", button: "Send reset link" },
};

function rememberTimeZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zone) document.cookie = `persist-tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
}

export function AuthForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setMessage(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
        });
        if (error) throw error;
        setMessage({ tone: "ok", text: "If that email has an account, a reset link is on its way. Open it in this browser." });
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        rememberTimeZone();
        window.location.assign(next);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback, data: name.trim() ? { name: name.trim() } : undefined },
      });
      if (error) throw error;
      if (!data.session) {
        setMessage({ tone: "ok", text: "Almost there. Check your email and confirm your address, then sign in." });
        return;
      }
      rememberTimeZone();
      window.location.assign(next);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setMessage(null);
    try {
      rememberTimeZone();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Couldn't start Google sign-in." });
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-navy">{COPY[mode].title}</h1>
      <p className="mt-2 text-ink-2">
        {mode === "forgot" ? "Enter your email and we'll send you a link." : "Your habits and check-ins stay private to you."}
      </p>

      {googleEnabled && mode !== "forgot" && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white text-[15px] font-semibold text-navy transition hover:bg-cream disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-4.9 3.4-8.4Z" />
              <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5Z" />
              <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
              <path fill="#EA4335" d="M12 5.4c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 7.4 9 5.4 12 5.4Z" />
            </svg>
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" />
            or use email
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} className={`space-y-4 ${googleEnabled && mode !== "forgot" ? "" : "mt-7"}`}>
        {mode === "signup" && (
          <Field label="Your name (optional)" htmlFor="name">
            <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
        )}
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        {mode !== "forgot" && (
          <Field label="Password" htmlFor="password" hint={mode === "signup" ? "Use at least 8 characters." : undefined}>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              message.tone === "error" ? "bg-danger-tint text-danger" : "bg-moss-tint text-moss-deep"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-moss text-[15px] font-semibold text-white transition hover:bg-moss-deep disabled:opacity-70"
        >
          {busy && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {COPY[mode].button}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-ink-2">
        {mode === "signin" && (
          <>
            <p>
              <button type="button" onClick={() => switchMode("forgot")} className="font-semibold text-teal underline underline-offset-4">
                Forgot your password?
              </button>
            </p>
            <p>
              New to {APP_NAME}?{" "}
              <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-teal underline underline-offset-4">
                Create an account
              </button>
            </p>
          </>
        )}
        {mode !== "signin" && (
          <p>
            <button type="button" onClick={() => switchMode("signin")} className="font-semibold text-teal underline underline-offset-4">
              Back to sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
