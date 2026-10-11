/** Small "x of y used this month" indicator. Turns amber when nearly used up. */
export function UsageNote({
  used,
  limit,
  noun,
  resetsOn,
}: {
  used: number;
  limit: number;
  noun: string;
  resetsOn: string;
}) {
  const left = Math.max(0, limit - used);
  const low = left <= Math.max(1, Math.floor(limit * 0.15));
  return (
    <p className={`text-sm ${low ? "font-medium text-gold-deep" : "text-ink-3"}`}>
      {used} of {limit} new {noun}s used this month
      {left === 0 ? `. Resets ${resetsOn}.` : ` · resets ${resetsOn}`}
    </p>
  );
}
