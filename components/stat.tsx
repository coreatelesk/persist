export function Stat({
  icon,
  value,
  label,
  note,
  accent = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border p-4 sm:p-5 ${accent ? "border-gold/40 bg-gold-tint" : "border-line bg-white"}`}>
      <div className={`flex items-center gap-1.5 text-sm font-medium ${accent ? "text-gold-deep" : "text-ink-2"}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold leading-none text-navy tabular-nums">{value}</p>
      {note && <p className={`mt-1.5 text-xs ${accent ? "text-gold-deep" : "text-ink-3"}`}>{note}</p>}
    </div>
  );
}
