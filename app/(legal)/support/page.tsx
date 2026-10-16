import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { LegalPage, Section } from "@/components/legal/prose";
import { Notice } from "@/components/ui/empty-state";
import { APP_NAME } from "@/lib/brand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <LegalPage title="Support" intro={`Need help with ${APP_NAME}? Here's how to reach us and a few quick answers.`}>
      <Section title="Contact us">
        {SITE.supportEmail ? (
          <>
            <a
              href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`${APP_NAME} support`)}`}
              className="!no-underline inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-moss px-5 text-[15px] !text-white hover:bg-moss-deep"
            >
              <Mail size={18} aria-hidden="true" /> {SITE.supportEmail}
            </a>
            <p>
              Please include the email you signed up with and a short description of what happened. Never send your password.
            </p>
          </>
        ) : (
          <Notice title="Support contact isn't available yet">
            {process.env.NODE_ENV === "production"
              ? "Please check back soon."
              : "Set NEXT_PUBLIC_SUPPORT_EMAIL in your environment to publish a contact address here."}
          </Notice>
        )}
        {SITE.operatorName && <p>Operated by {SITE.operatorName}.</p>}
        {SITE.operatorAddress && <p>Postal address: {SITE.operatorAddress}</p>}
      </Section>

      <Section title="Common questions">
        <ul>
          <li>
            <strong>I reached a limit.</strong> Archive or delete something you no longer need. Archiving keeps all history. If your archive is full, delete or restore an archived item first.
          </li>
          <li>
            <strong>I forgot my password.</strong> Use &ldquo;Forgot your password?&rdquo; on the <Link href="/login">sign-in page</Link>.
          </li>
          <li>
            <strong>How do I delete my account?</strong> Sign in and open <Link href="/account/delete">Delete account</Link>. It permanently removes your data.
          </li>
          <li>
            <strong>How do I get a copy of my data?</strong> Sign in and use the download buttons on the <Link href="/account">Account</Link> page.
          </li>
          <li>
            <strong>I have an idea or found a bug.</strong> Send it from the <Link href="/feedback">Feedback</Link> page and follow its status there.
          </li>
          <li>
            <strong>Can I change my name or phone number?</strong> Yes, on the <Link href="/account">Account</Link> page.
          </li>
        </ul>
      </Section>
    </LegalPage>
  );
}
