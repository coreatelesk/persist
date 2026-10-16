import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  EyeOff,
  Flag,
  Flame,
  LayoutDashboard,
  MessageSquarePlus,
  Repeat2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Heatmap, HeatmapLegend } from "@/components/heatmap";
import { ButtonLink } from "@/components/ui/button-link";
import { adsEnabled } from "@/lib/ads/config";
import { APP_NAME, taglineLines } from "@/lib/brand";
import { CHANGELOG, formatChangelogDate } from "@/lib/changelog";
import { FREE_DEFAULTS } from "@/lib/entitlements";
import { sampleDays } from "@/lib/sample";

const SIGNUP = "/login?mode=signup";
const section = "mx-auto max-w-6xl px-5 sm:px-8";
const h2 = "font-display text-3xl font-bold leading-tight text-navy sm:text-4xl";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Brand href="/" />
        <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
          {[
            ["#features", "Features"],
            ["#how", "How it works"],
            ["#privacy", "Privacy"],
            ["#updates", "What's new"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-2 transition hover:bg-cream-deep hover:text-navy">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-navy hover:bg-cream-deep min-[380px]:inline-flex">
            Sign in
          </Link>
          <ButtonLink href={SIGNUP} className="min-h-10 px-4">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

const PREVIEW_ITEMS = [
  { title: "Read 20 pages", detail: "Every day", done: true, streak: "12d" },
  { title: "Morning walk", detail: "Weekdays", done: true, streak: "5d" },
  { title: "Strength training", detail: "2 of 3 this week", done: false },
  { title: "Write 300 words", detail: "Every day", done: false },
];

/** A static picture of the Today screen, built from the same visual language as the real one. */
function PreviewCard() {
  return (
    <div className="relative">
      <div role="group" aria-label="Example of the Today screen with sample habits" className="rounded-[1.75rem] border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(30,58,95,0.45)] sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-5xl font-bold leading-none text-navy tabular-nums">
              2<span className="text-3xl text-ink-3"> / 4</span>
            </p>
            <p className="mt-2 text-sm text-ink-2">2 left for today</p>
          </div>
          <span className="rounded-full bg-cream-deep px-3 py-1 text-xs font-semibold text-ink-2">Example</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-cream-deep" aria-hidden="true">
          <div className="h-full w-1/2 rounded-full bg-moss" />
        </div>
        <ul className="mt-5 space-y-2.5">
          {PREVIEW_ITEMS.map((i) => (
            <li key={i.title} className={`flex items-center gap-3.5 rounded-2xl border p-3 pr-4 ${i.done ? "border-moss/25 bg-moss-tint/60" : "border-line bg-white"}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-full border-2 ${i.done ? "border-moss bg-moss text-white" : "border-line-strong"}`}>
                {i.done && <Check size={20} strokeWidth={3} aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${i.done ? "text-ink-2" : "text-navy"}`}>{i.title}</p>
                <p className="truncate text-sm text-ink-2">{i.detail}</p>
              </div>
              {i.streak && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-xs font-bold text-gold-deep">
                  <Flame size={13} aria-hidden="true" />
                  {i.streak}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className={`${section} grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20`}>
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-2">
          <Sparkles size={15} className="text-gold-deep" aria-hidden="true" /> Free to start · No credit card
        </p>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] text-navy sm:text-6xl lg:text-7xl">
          {taglineLines().map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-ink-2">
          {APP_NAME} helps you build habits that stick. Check things off in seconds, take on focused challenges, and watch a visual record of every day you showed up grow over time.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={SIGNUP} className="min-h-12 px-7 text-base">
            Get started free <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
          <a href="#how" className="inline-flex min-h-12 items-center rounded-xl border border-line-strong bg-white px-6 text-base font-semibold text-navy transition hover:bg-cream-deep">
            See how it works
          </a>
        </div>
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-ink-2">
          {["Private by default", "Export or delete anytime", "Works on any phone"].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <Check size={16} strokeWidth={3} className="text-moss" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <PreviewCard />
    </section>
  );
}

export function ConsistencySection({ today }: { today: string }) {
  return (
    <section className={`${section} pb-20 sm:pb-24`} aria-labelledby="consistency-heading">
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 id="consistency-heading" className="font-display text-2xl font-bold text-navy sm:text-3xl">
              Proof, not just a to-do list
            </h2>
            <p className="mt-2 text-ink-2">
              Every check-in becomes a square. Over weeks and months, the picture shows whether you really showed up, and nothing motivates like watching it fill in.
            </p>
          </div>
          <HeatmapLegend />
        </div>
        <div className="mt-6">
          <Heatmap days={sampleDays(today, 52)} today={today} linkToHistory={false} />
        </div>
        <p className="mt-3 text-xs text-ink-3">Example data. Darker days mean more of the plan got done.</p>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { title: "Choose what matters", body: "Create habits that run every day, on weekdays, on days you pick, or a set number of times a week. Or start a challenge with a length and a goal." },
    { title: "Check in each day", body: "Open Today and tap what you did. Check-ins are for today only, so your record stays honest." },
    { title: "Watch the proof build", body: "See streaks, a year-long consistency graph, a history calendar, and how often you actually follow through on each habit." },
  ];
  return (
    <section id="how" className={`${section} scroll-mt-24 pb-20 sm:pb-24`} aria-labelledby="how-heading">
      <h2 id="how-heading" className={h2}>
        How it works
      </h2>
      <p className="mt-3 max-w-xl text-lg text-ink-2">Three simple steps. No setup maze, no clutter.</p>
      <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
            <span className="grid size-10 place-items-center rounded-full bg-navy font-display text-lg font-bold text-white">{i + 1}</span>
            <h3 className="mt-4 font-display text-xl font-semibold text-navy">{s.title}</h3>
            <p className="mt-2 leading-7 text-ink-2">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Features() {
  const items = [
    { icon: LayoutDashboard, title: "One calm Today screen", body: "See exactly what's left and tick it off in a tap, with instant feedback." },
    { icon: Repeat2, title: "Flexible schedules", body: "Every day, weekdays, specific days, or a weekly target. Rest days never break your streak." },
    { icon: Flag, title: "Challenges with goals", body: "Run a 7 to 365 day challenge, set a goal like 25 of 30 days, and track progress to the finish." },
    { icon: TrendingUp, title: "Streaks and milestones", body: "Celebrate a week, a month, a hundred days, with honest numbers rather than gimmicks." },
    { icon: CalendarDays, title: "History you can browse", body: "A month calendar shows each day's check-ins, plus how consistent you've been per habit." },
    { icon: Smartphone, title: "Built for your phone", body: "Large tap targets, a bottom navigation bar, and fast pages. Works in any modern browser." },
  ];
  return (
    <section id="features" className={`${section} scroll-mt-24 pb-20 sm:pb-24`} aria-labelledby="features-heading">
      <h2 id="features-heading" className={h2}>
        Everything you need, nothing you don&apos;t
      </h2>
      <p className="mt-3 max-w-xl text-lg text-ink-2">Focused on one job: helping you show up consistently.</p>
      <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-tint text-teal">
              <Icon size={21} aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-1 leading-7 text-ink-2">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrustSection() {
  const ads = adsEnabled();
  const points = [
    { icon: EyeOff, title: "Private by design", body: "Database rules mean only your account can read your habits and check-ins. The owner's dashboard shows usage totals and basic account details, never what your habits are called." },
    { icon: Download, title: "Your data, your call", body: "Export everything as JSON or a spreadsheet-friendly CSV at any time, right from your account page." },
    { icon: Trash2, title: "Delete whenever you like", body: "Delete your account in the app and your habits, challenges and check-ins are removed with it." },
    { icon: ShieldCheck, title: "Honest about money and ads", body: ads ? `The Free plan is genuinely usable, and no payment details are ever requested. A single small banner ad can appear on your Today page, but only if you allow advertising cookies, which you can change any time.` : "The Free plan is genuinely usable, and no payment details are ever requested. There are no ads and no advertising cookies right now; if that ever changes, you'll be asked first." },
  ];
  return (
    <section id="privacy" className="scroll-mt-24 bg-navy py-20 text-white sm:py-24" aria-labelledby="privacy-heading">
      <div className={section}>
        <h2 id="privacy-heading" className="font-display text-3xl font-bold leading-tight sm:text-4xl">
          Your habits are yours
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-white/75">Habits are personal. Here&apos;s how {APP_NAME} treats them.</p>
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {points.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-[var(--radius-card)] border border-white/12 bg-white/6 p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-white/12 text-gold">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-white/75">{body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-white/75">
          Read the plain-language{" "}
          <Link href="/privacy" className="font-semibold text-white underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/cookies" className="font-semibold text-white underline underline-offset-4">
            cookie details
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function UpdatesSection() {
  const recent = CHANGELOG.slice(0, 4);
  return (
    <section id="updates" className={`${section} scroll-mt-24 py-20 sm:py-24`} aria-labelledby="updates-heading">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h2 id="updates-heading" className={h2}>
            Improving all the time
          </h2>
          <p className="mt-3 max-w-md text-lg text-ink-2">
            {APP_NAME} is actively developed, and it&apos;s shaped by the people who use it. Send an idea from inside the app and you can follow what happens to it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/feedback" variant="navy">
              <MessageSquarePlus size={18} aria-hidden="true" /> Suggest a feature
            </ButtonLink>
          </div>
          <p className="mt-3 text-sm text-ink-3">You&apos;ll be asked to sign in first so we can show you its status.</p>
        </div>
        <ol className="space-y-3">
          {recent.map((c) => (
            <li key={c.date + c.title} className="rounded-[var(--radius-card)] border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-full bg-moss-tint px-2.5 py-1 text-xs font-semibold text-moss-deep">New</span>
                <time dateTime={c.date} className="text-sm text-ink-3">
                  {formatChangelogDate(c.date)}
                </time>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-navy">{c.title}</h3>
              <p className="mt-1 leading-7 text-ink-2">{c.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Faq() {
  const l = FREE_DEFAULTS.limits;
  const ads = adsEnabled();
  const items = [
    { q: "Is it really free?", a: `Yes. The Free plan lets you keep up to ${l.active_habits} active habits and ${l.active_challenges} active challenges, with room to archive ${l.archived_habits} habits and ${l.archived_challenges} challenges. You never enter payment details.${ads ? " A single small banner ad may appear if you allow advertising cookies." : ""}` },
    { q: "Who can see my habits?", a: "Only you. Database rules prevent other accounts from reading your records. The person running the service can see usage totals and basic account details such as your email and sign-up date, but not the names or notes of your habits." },
    { q: "Can I take my data with me?", a: "Yes. From your account page you can download everything as a JSON file, or your check-ins as a CSV that opens in any spreadsheet." },
    { q: "Can I delete my account?", a: "Yes, any time, from your account page. Your habits, challenges and check-ins are deleted with it." },
    { q: "What happens if I miss a day?", a: "Nothing dramatic. Rest days on your schedule never break a streak, and a missed day simply shows as an empty square. Check-ins are for today only, which keeps the record honest." },
    { q: "Does it work on my phone?", a: "Yes. It runs in your phone's browser with a layout designed for small screens. There's no app to install." },
    { q: "How do I ask for a feature or report a problem?", a: "Use the Feedback page after you sign in. You can see the status of everything you've sent, and sometimes a reply from the team." },
  ];
  return (
    <section id="faq" className={`${section} scroll-mt-24 pb-20 sm:pb-24`} aria-labelledby="faq-heading">
      <h2 id="faq-heading" className={h2}>
        Questions, answered
      </h2>
      <div className="mt-8 max-w-3xl divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-1 sm:px-6">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-navy [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown size={20} className="shrink-0 text-ink-3 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pb-5 leading-7 text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className={`${section} pb-20 sm:pb-24`} aria-labelledby="cta-heading">
      <div className="rounded-[2rem] bg-navy px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <h2 id="cta-heading" className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">
          Start leaving proof today
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Pick one small habit. Check it off tonight. Let the picture build from there.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={SIGNUP} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-7 text-base font-semibold text-navy-deep transition hover:brightness-95">
            Get started free <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/login" className="inline-flex min-h-12 items-center rounded-xl border border-white/30 px-6 text-base font-semibold text-white transition hover:bg-white/10">
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}
