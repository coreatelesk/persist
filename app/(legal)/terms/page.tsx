import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, Section } from "@/components/legal/prose";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`By creating an account or using ${APP_NAME}, you agree to these terms. If you don't agree, please don't use the service.`}
    >
      <Section title="The service">
        <p>{APP_NAME} is a habit and challenge tracker. It is a personal productivity tool and not medical, mental-health, financial, or professional advice.</p>
      </Section>

      <Section title="Your account">
        <ul>
          <li>Give accurate information and keep your sign-in details secure. You are responsible for activity on your account.</li>
          <li>You must be old enough to form a binding agreement where you live, and at least 13 years old.</li>
          <li>Tell us promptly if you think someone has accessed your account without permission.</li>
        </ul>
      </Section>

      <Section title="Acceptable use">
        <p>Please don&apos;t:</p>
        <ul>
          <li>break the law or infringe others&apos; rights through the service;</li>
          <li>attempt to access other people&apos;s accounts or data, or probe, disrupt, or overload the service;</li>
          <li>use automation, scripts, or multiple accounts to get around usage limits;</li>
          <li>upload harmful, abusive, or unlawful content in your habit or challenge text.</li>
        </ul>
      </Section>

      <Section title="Usage limits">
        <p>Accounts have limits on how many active and archived habits and challenges they can hold. These limits are shown in the app and may change over time. Reaching a limit never deletes your existing records.</p>
      </Section>

      <Section title="Your content">
        <p>You own what you put into {APP_NAME}. You give us permission to store and process it only as needed to run the service for you, as described in the <Link href="/privacy">Privacy Policy</Link>.</p>
      </Section>

      <Section title="Feedback">
        <p>If you send us ideas or suggestions, we may use them to improve the service without obligation or payment to you. We can&apos;t promise that any suggestion will be built.</p>
      </Section>

      <Section title="Availability and changes">
        <p>We aim to keep the service running but can&apos;t guarantee it will always be available or free of errors. We may change, suspend, or discontinue features, and we may update these terms. Continued use after an update means you accept the new terms.</p>
      </Section>

      <Section title="Ending your account">
        <p>You can delete your account at any time from the <Link href="/account/delete">Delete account</Link> page. We may suspend or close accounts that break these terms or put the service or other users at risk.</p>
      </Section>

      <Section title="Disclaimers and liability">
        <p>The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind to the extent the law allows. To the extent the law allows, we are not liable for indirect or consequential losses, or for loss of data or progress. Keep your own record of anything you can&apos;t afford to lose. Nothing in these terms limits rights that cannot be limited by law.</p>
      </Section>

      <Section title="Contact">
        <ContactLine />
      </Section>
    </LegalPage>
  );
}
