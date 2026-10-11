export const inputClass =
  "w-full min-h-12 rounded-xl border border-line-strong bg-white px-4 text-base text-navy placeholder:text-ink-3 outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15 aria-[invalid=true]:border-danger";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-ink-2">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
