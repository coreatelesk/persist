import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1E3A5F" />
      <g fill="#F5F3ED">
        <rect x="14" y="14" width="10" height="10" rx="3" opacity=".35" />
        <rect x="27" y="14" width="10" height="10" rx="3" opacity=".6" />
        <rect x="40" y="14" width="10" height="10" rx="3" />
        <rect x="27" y="27" width="10" height="10" rx="3" opacity=".6" />
        <rect x="40" y="27" width="10" height="10" rx="3" />
        <rect x="14" y="40" width="10" height="10" rx="3" opacity=".35" />
        <rect x="27" y="40" width="10" height="10" rx="3" />
      </g>
      <rect x="40" y="40" width="10" height="10" rx="3" fill="#E5A323" />
    </svg>
  );
}

export function Brand({ href = "/dashboard", tone = "dark" }: { href?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg">
      <BrandMark />
      <span className={`font-display text-xl font-bold tracking-tight ${tone === "light" ? "text-white" : "text-navy"}`}>
        {APP_NAME}
      </span>
    </Link>
  );
}
