export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-tint text-teal">{icon}</span>
      <h2 className="mt-4 font-display text-xl font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-2">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "error";
  title: string;
  children?: React.ReactNode;
}) {
  const color = tone === "error" ? "border-danger/30 bg-danger-tint text-danger" : "border-gold/40 bg-gold-tint text-gold-deep";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3.5 text-sm ${color}`}>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 leading-6 opacity-90">{children}</div>}
    </div>
  );
}
