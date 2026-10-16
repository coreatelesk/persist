import "server-only";
import { cookies } from "next/headers";
import { CONSENT_COOKIE, parseConsent, type ConsentChoice } from "@/lib/consent";

export async function getConsent(): Promise<ConsentChoice | null> {
  const store = await cookies();
  return parseConsent(store.get(CONSENT_COOKIE)?.value);
}
