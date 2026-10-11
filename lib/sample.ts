import { addDays, weekday } from "@/lib/dates";
import type { DayCell, Level } from "@/lib/tracking/stats";

/** Deterministic demo data for marketing surfaces (never shown as a user's own progress). */
export function sampleDays(today: string, weeks = 26): DayCell[] {
  const count = weeks * 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(today, -(count - 1 - i));
    const wave = Math.sin(i / 9) * 0.5 + 0.5; // slow rhythm of strong and weak weeks
    const noise = ((i * 2654435761) % 1000) / 1000;
    const weekend = [0, 6].includes(weekday(date)) ? 0.25 : 0;
    const score = wave * 0.75 + noise * 0.55 - weekend + i / (count * 4);
    const level = (score < 0.32 ? 0 : score < 0.55 ? 1 : score < 0.78 ? 2 : score < 1 ? 3 : 4) as Level;
    cells.push({ date, done: level, total: 4, level });
  }
  return cells;
}
