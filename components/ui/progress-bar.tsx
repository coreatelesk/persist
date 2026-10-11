export function ProgressBar({
  value,
  label,
  tone = "moss",
  className = "",
}: {
  value: number;
  label: string;
  tone?: "moss" | "gold";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`h-2.5 overflow-hidden rounded-full bg-cream-deep ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tone === "gold" ? "bg-gold" : "bg-moss"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
