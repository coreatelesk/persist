import { POLICY_UPDATED, SITE } from "@/lib/site";

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article>
      <h1 className="font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">Last updated {POLICY_UPDATED}</p>
      {intro && <p className="mt-5 text-[17px] leading-8 text-ink-2">{intro}</p>}
      <div className="mt-8 space-y-9">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-navy">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-ink-2 [&_a]:font-semibold [&_a]:text-teal [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** The contact line used across the policies. Shows only details that have been configured. */
export function ContactLine() {
  return (
    <p>
      {SITE.supportEmail ? (
        <>
          Contact us at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </>
      ) : (
        <>Contact details for support have not been published yet.</>
      )}
      {SITE.operatorName && <> This service is operated by {SITE.operatorName}.</>}
      {SITE.operatorAddress && <> Postal address: {SITE.operatorAddress}.</>}
    </p>
  );
}
