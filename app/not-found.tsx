import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-5xl font-bold text-navy">Page not found</h1>
        <p className="mt-3 text-ink-2">That page doesn&apos;t exist, or it isn&apos;t yours to see.</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/dashboard">Back to today</ButtonLink>
        </div>
      </div>
    </main>
  );
}
