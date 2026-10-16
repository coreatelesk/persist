import { redirect } from "next/navigation";
import { ConsistencySection, Faq, Features, FinalCta, Hero, HowItWorks, LandingHeader, TrustSection, UpdatesSection } from "@/components/landing/sections";
import { LegalFooter } from "@/components/legal-footer";
import { getSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";
import { getToday } from "@/lib/tz";

export default async function Home({ searchParams }: { searchParams: Promise<{ account_deleted?: string }> }) {
  const params = await searchParams;
  if (await getSession()) redirect("/dashboard");
  const { today } = await getToday();

  return (
    <div className="min-h-dvh">
      <LandingHeader />
      <main>
        {params.account_deleted === "1" && (
          <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
            <p role="status" className="rounded-xl bg-moss-tint px-4 py-3 text-sm font-medium text-moss-deep">
              Your account and its data have been deleted. Thanks for trying {APP_NAME}.
            </p>
          </div>
        )}
        <Hero />
        <ConsistencySection today={today} />
        <HowItWorks />
        <Features />
        <TrustSection />
        <UpdatesSection />
        <Faq />
        <FinalCta />
      </main>
      <LegalFooter variant="site" />
    </div>
  );
}
