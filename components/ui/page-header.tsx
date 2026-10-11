export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-base text-ink-2">{description}</p>}
      </div>
      {action}
    </header>
  );
}
