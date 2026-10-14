import "server-only";
import { cookies } from "next/headers";
import { isValidTimeZone, todayIn } from "@/lib/dates";

import { TZ_COOKIE } from "@/lib/tz-constants";
export { TZ_COOKIE };

/** The visitor's IANA time zone, set by <TimezoneSync />. Falls back to UTC. */
export async function getTimeZone(): Promise<string> {
  const store = await cookies();
  const value = store.get(TZ_COOKIE)?.value;
  const decoded = value ? decodeURIComponent(value) : undefined;
  return isValidTimeZone(decoded) ? decoded : "UTC";
}

export async function getToday() {
  const timeZone = await getTimeZone();
  return { timeZone, today: todayIn(timeZone) };
}
