"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { addDays, formatKey, mondayIndex, monthOf, startOfWeek } from "@/lib/dates";
import type { DayCell } from "@/lib/tracking/stats";

const LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

function describe(day: DayCell) {
  const when = formatKey(day.date, "medium");
  if (day.level === -1) return `${when}: nothing scheduled`;
  if (day.done === 0) return `${when}: none of ${day.total} done`;
  return `${when}: ${day.done} of ${day.total} done`;
}

/**
 * A GitHub-style grid: one column per week (Monday first), one square per day.
 * Newest week is on the right and scrolled into view on narrow screens.
 */
export function Heatmap({
  days,
  today,
  linkToHistory = true,
}: {
  days: DayCell[];
  today: string;
  linkToHistory?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  if (days.length === 0) return null;

  const first = days[0].date;
  const gridStart = startOfWeek(first);
  const lead = mondayIndex(first);
  const cells: (DayCell | null)[] = [...Array<null>(lead).fill(null), ...days];
  const weeks = Math.ceil(cells.length / 7);

  // Month labels sit above the first week that begins in a new month.
  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = "";
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(gridStart, w * 7);
    const m = monthOf(weekStart);
    if (m !== lastMonth && !(w === 0 && lead > 4)) {
      monthLabels.push({ week: w, label: formatKey(weekStart, "monthShort") });
    }
    lastMonth = m;
  }

  return (
    <div className="flex gap-2">
      <div className="mt-6 grid shrink-0 grid-rows-7 gap-1 text-[11px] leading-[14px] text-ink-3" aria-hidden="true">
        {LABELS.map((label, i) => (
          <span key={i} className="h-3.5">
            {label}
          </span>
        ))}
      </div>
      <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto pb-2 pt-1" tabIndex={-1}>
        <div className="w-max">
          <div
            className="mb-1.5 grid h-4 gap-1 text-[11px] leading-4 text-ink-3"
            style={{ gridTemplateColumns: `repeat(${weeks}, 14px)` }}
            aria-hidden="true"
          >
            {monthLabels.map(({ week, label }) => (
              <span key={week} style={{ gridColumnStart: week + 1 }} className="whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: "repeat(7, 14px)", gridAutoColumns: "14px" }}
            role="img"
            aria-label="Daily check-in heatmap"
          >
            {cells.map((day, i) => {
              if (!day) return <span key={`pad-${i}`} aria-hidden="true" />;
              const props = {
                className: "heat",
                "data-level": day.level,
                "data-today": day.date === today,
                title: describe(day),
              };
              return linkToHistory ? (
                <Link key={day.date} href={`/history?date=${day.date}`} aria-label={describe(day)} {...props} />
              ) : (
                <span key={day.date} {...props} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-3" aria-hidden="true">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span key={level} className="heat" data-level={level} style={{ width: 12, height: 12 }} />
      ))}
      <span>More</span>
    </div>
  );
}
