import { Brand } from "@/components/brand";
import { LegalFooter } from "@/components/legal-footer";
import { ButtonLink } from "@/components/ui/button-link";
import { getSession } from "@/lib/auth/session";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const signedIn = !!(await getSession());
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand href={signedIn ? "/dashboard" : "/"} />
        <ButtonLink href={signedIn ? "/dashboard" : "/login"} variant="quiet" className="min-h-10">
          {signedIn ? "Back to app" : "Sign in"}
        </ButtonLink>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-12 pt-4 sm:px-8">{children}</main>
      <LegalFooter className="mx-auto max-w-3xl border-t border-line px-5 py-8 sm:px-8" />
    </div>
  );
}
