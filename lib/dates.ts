/**
 * Date helpers. A "date key" is a plain calendar date string (YYYY-MM-DD).
 * All arithmetic is done in UTC on those strings, so it never drifts with
 * the server's time zone. The only time-zone-aware function is `todayIn`.
 */
const DAY_MS = 86_400_000;
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !KEY_RE.test(value)) return false;
  const date = parseKey(value);
  return !Number.isNaN(date.getTime()) && toKey(date) === value;
}

export function addDays(key: string, amount: number): string {
  return toKey(new Date(parseKey(key).getTime() + amount * DAY_MS));
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(key: string): number {
  return parseKey(key).getUTCDay();
}

/** 0 = Monday … 6 = Sunday. */
export function mondayIndex(key: string): number {
  return (weekday(key) + 6) % 7;
}

export function startOfWeek(key: string): string {
  return addDays(key, -mondayIndex(key));
}

export function monthOf(key: string): string {
  return key.slice(0, 7);
}

export function addMonths(month: string, amount: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + amount, 1));
  return toKey(date).slice(0, 7);
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isValidTimeZone(timeZone: string | undefined | null): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function partsIn(timeZone: string, now: Date) {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return { year: get("year"), month: get("month"), day: get("day"), hour: Number(get("hour")) };
}

/**
 * Browsers still report some zones by legacy names (Chrome says "Asia/Calcutta" for India).
 * Not every database knows those aliases, so names sent to the database are first mapped to
 * their canonical IANA equivalents.
 */
const LEGACY_ZONES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Dacca": "Asia/Dhaka",
  "Asia/Thimbu": "Asia/Thimphu",
  "Asia/Ulan_Bator": "Asia/Ulaanbaatar",
  "Asia/Macao": "Asia/Macau",
  "Europe/Kiev": "Europe/Kyiv",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Pacific/Truk": "Pacific/Chuuk",
  "Pacific/Ponape": "Pacific/Pohnpei",
};

export function canonicalTimeZone(timeZone: string): string {
  return LEGACY_ZONES[timeZone] ?? timeZone;
}

/** The calendar date it currently is in the given IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const { year, month, day } = partsIn(timeZone, now);
  return `${year}-${month}-${day}`;
}

export function hourIn(timeZone: string, now: Date = new Date()): number {
  return partsIn(timeZone, now).hour;
}

/** Convert a timestamp to the calendar date it falls on in the given zone. */
export function keyInZone(iso: string, timeZone: string): string {
  return todayIn(timeZone, new Date(iso));
}

type Style = "long" | "medium" | "short" | "month" | "monthShort" | "weekdayShort";

// Fixed English names, not Intl. Server and browser locale data differ slightly
// (for example "Tue 13 Oct" vs "Tue, 13 Oct"), and any difference in text that is rendered
// on both sides causes a React hydration error.
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatKey(key: string, style: Style = "medium"): string {
  const date = parseKey(key);
  const day = date.getUTCDate();
  const wd = date.getUTCDay();
  const m = date.getUTCMonth();
  switch (style) {
    case "long":
      return `${WEEKDAYS_LONG[wd]} ${day} ${MONTHS_LONG[m]}`;
    case "medium":
      return `${WEEKDAYS_SHORT[wd]} ${day} ${MONTHS_SHORT[m]}`;
    case "short":
      return `${day} ${MONTHS_SHORT[m]}`;
    case "month":
      return `${MONTHS_LONG[m]} ${date.getUTCFullYear()}`;
    case "monthShort":
      return MONTHS_SHORT[m];
    case "weekdayShort":
      return WEEKDAYS_SHORT[wd];
  }
}

export const WEEKDAYS_MON_FIRST = [
  { index: 1, short: "Mon", long: "Monday" },
  { index: 2, short: "Tue", long: "Tuesday" },
  { index: 3, short: "Wed", long: "Wednesday" },
  { index: 4, short: "Thu", long: "Thursday" },
  { index: 5, short: "Fri", long: "Friday" },
  { index: 6, short: "Sat", long: "Saturday" },
  { index: 0, short: "Sun", long: "Sunday" },
] as const;
