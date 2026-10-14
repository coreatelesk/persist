import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, Section } from "@/components/legal/prose";
import { adsEnabled } from "@/lib/ads/config";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const ads = adsEnabled();
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${APP_NAME} collects, why, and the choices you have. We try to collect only what we need to run a habit and challenge tracker.`}
    >
      <Section title="What we collect">
        <ul>
          <li>
            <strong>Account details:</strong> your email address and password. Passwords are handled by our authentication provider and are stored in hashed form; we never see them in plain text. If Google sign-in is offered and you use it, we receive your email and name from Google.
          </li>
          <li>
            <strong>Profile details you choose to add:</strong> a display name and, optionally, a mobile number. The mobile number is optional and is not used to send you messages at present.
          </li>
          <li>
            <strong>Your content:</strong> the habits and challenges you create (names, notes, schedules, dates, goals) and your check-ins.
          </li>
          <li>
            <strong>Activity records:</strong> when you create, edit, archive, or restore a habit, manage a challenge, or complete a check-in, we record the type of action, a timestamp, and an internal item ID. These records never contain the names or notes of your habits or challenges. We use them to work out when you were last active and to understand overall use of the service.
          </li>
          <li>
            <strong>Technical data:</strong> cookies that keep you signed in and remember your time zone (see <Link href="/cookies">Advertising and cookies</Link>). Our hosting and database providers may also keep standard server logs, such as IP addresses, for security and operation.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul>
          <li>To provide the service: sign you in, save your habits and challenges, and show your progress and history.</li>
          <li>To apply usage limits and keep the service secure and reliable.</li>
          <li>To answer support requests.</li>
          <li>To understand how the service is used: the platform owner can see account details (email, name, sign-up date, last active time, and counts of habits, challenges, and check-ins) and overall usage figures. The owner&apos;s dashboard does not show the names or notes of your habits or challenges, or your mobile number.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="Who else handles your data">
        <ul>
          <li>
            <strong>Supabase</strong> provides authentication and the database where your data is stored.
          </li>
          <li>
            <strong>Our web host</strong> serves the application.
          </li>
          {ads ? (
            <li>
              <strong>Google</strong> provides the advertising shown on the dashboard, and Google sign-in if offered. See <Link href="/cookies">Advertising and cookies</Link>.
            </li>
          ) : (
            <li>
              <strong>Google</strong> receives information only if you choose Google sign-in, where offered. No advertising service is currently active.
            </li>
          )}
        </ul>
      </Section>

      <Section title="How your data is protected">
        <ul>
          <li>Data is sent over encrypted connections when the service is served over HTTPS.</li>
          <li>Database access rules mean each signed-in user can read and change only their own records.</li>
          <li>Access to the owner dashboard is limited to named administrator accounts.</li>
        </ul>
        <p>No online service can promise perfect security, so please use a strong, unique password.</p>
      </Section>

      <Section title="How long we keep it">
        <p>We keep your data while your account exists. When you delete your account, your profile, habits, challenges, check-ins, and activity records are deleted. Backups held by our database provider may keep a copy for a limited time until they expire.</p>
      </Section>

      <Section title="Your choices">
        <ul>
          <li>Update your name and mobile number any time on the <Link href="/account">Account</Link> page.</li>
          <li>Delete individual habits and challenges, or delete your whole account from <Link href="/account/delete">Delete account</Link> (you must be signed in).</li>
          <li>For anything else, such as a question about your data or a request for a copy, contact support.</li>
        </ul>
      </Section>

      <Section title="Children">
        <p>{APP_NAME} is not directed at children under 13, and we do not knowingly collect their information.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If we change this policy we will update the date at the top. If a change is significant we will make a reasonable effort to tell you.</p>
      </Section>

      <Section title="Contact">
        <ContactLine />
      </Section>
    </LegalPage>
  );
}
