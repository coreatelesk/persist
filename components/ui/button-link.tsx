import Link from "next/link";

const styles = {
  primary: "bg-moss text-white hover:bg-moss-deep",
  navy: "bg-navy text-white hover:bg-navy-deep",
  quiet: "border border-line-strong bg-white text-navy hover:bg-cream-deep",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
