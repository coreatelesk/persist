"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Remembers the visitor's time zone in a cookie so "today" is correct on the server. */
export function TimezoneSync() {
  const router = useRouter();
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    const current = document.cookie.match(/(?:^|; )persist-tz=([^;]+)/)?.[1];
    if (current && decodeURIComponent(current) === zone) return;
    document.cookie = `persist-tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
