import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

const links = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Ads & cookies" },
  { href: "/support", label: "Support" },
];

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-sm text-ink-3 ${className}`}>
      <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded py-1.5 hover:text-navy hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-1">© {new Date().getFullYear()} {APP_NAME}</p>
    </footer>
  );
}
