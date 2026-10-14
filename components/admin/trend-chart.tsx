/** A dependency-free SVG bar chart. Server-rendered, scales to its container. */
export function TrendChart({
  title,
  labels,
  values,
  unit = "",
  color = "var(--color-moss)",
}: {
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
  color?: string;
}) {
  const W = 640;
  const H = 190;
  const left = 36;
  const bottom = 24;
  const top = 8;
  const n = values.length;
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const plotW = W - left - 4;
  const plotH = H - bottom - top;
  const slot = n ? plotW / n : plotW;
  const bar = Math.max(1, slot * 0.72);

  // At most six evenly spaced axis labels so they never overlap.
  const ticks = n <= 6 ? values.map((_, i) => i) : Array.from({ length: 6 }, (_, i) => Math.round((i * (n - 1)) / 5));

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-display text-base font-semibold text-navy">{title}</span>
        <span className="text-sm tabular-nums text-ink-2">{total.toLocaleString("en-IN")} total</span>
      </figcaption>
      {total === 0 ? (
        <p className="mt-3 grid h-40 place-items-center rounded-xl bg-cream text-sm text-ink-3">Nothing in this period yet.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title}: ${total} in total over ${n} periods, peak ${max}${unit}`}
          className="mt-3 h-auto w-full"
        >
          {[0, 0.5, 1].map((f) => {
            const y = top + plotH - f * plotH;
            return (
              <g key={f}>
                <line x1={left} x2={W - 4} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" />
                <text x={left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-3)">
                  {Math.round(max * f).toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}
          {values.map((v, i) => {
            const h = (v / max) * plotH;
            return (
              <rect key={i} x={left + i * slot + (slot - bar) / 2} y={top + plotH - h} width={bar} height={Math.max(v > 0 ? 1.5 : 0, h)} rx={Math.min(3, bar / 2)} fill={color}>
                <title>{`${labels[i]}: ${v}${unit}`}</title>
              </rect>
            );
          })}
          {ticks.map((i) => (
            <text
              key={i}
              x={left + i * slot + slot / 2}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize="11"
              fill="var(--color-ink-3)"
            >
              {labels[i]}
            </text>
          ))}
        </svg>
      )}
    </figure>
  );
}
