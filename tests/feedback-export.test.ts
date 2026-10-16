import { describe, expect, it, vi } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { feedbackSchema, feedbackUpdateSchema } from "@/lib/validation";
import { CONSENT_COOKIE, parseConsent } from "@/lib/consent";
import { CHANGELOG, formatChangelogDate } from "@/lib/changelog";
import { friendlyDbError } from "@/lib/db-errors";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("CSV export is safe to open in a spreadsheet", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });
  it("neutralises formula injection in user-written names", () => {
    for (const evil of ["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)"]) {
      expect(csvCell(evil).replace(/^"/, "").startsWith("'")).toBe(true);
    }
    expect(csvCell("Read 20 pages")).toBe("Read 20 pages");
  });
  it("builds rows with CRLF line endings", () => {
    expect(toCsv([["type", "name"], ["habit", "Read, daily"]])).toBe('type,name\r\nhabit,"Read, daily"\r\n');
  });
});

describe("feedback validation", () => {
  it("accepts a reasonable message and trims it", () => {
    const r = feedbackSchema.parse({ category: "feature", message: "   Please add a dark mode.   " });
    expect(r.message).toBe("Please add a dark mode.");
  });
  it("rejects short, long, and unknown-category input", () => {
    expect(feedbackSchema.safeParse({ category: "feature", message: "too short" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ category: "feature", message: "x".repeat(2001) }).success).toBe(false);
    expect(feedbackSchema.safeParse({ category: "spam", message: "a perfectly long enough message" }).success).toBe(false);
  });
  it("validates the admin update", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(feedbackUpdateSchema.safeParse({ id, status: "planned", note: "Soon" }).success).toBe(true);
    expect(feedbackUpdateSchema.safeParse({ id, status: "hacked" }).success).toBe(false);
    expect(feedbackUpdateSchema.safeParse({ id: "nope", status: "done" }).success).toBe(false);
    expect(feedbackUpdateSchema.safeParse({ id, status: "done", note: "x".repeat(501) }).success).toBe(false);
  });
  it("explains the daily feedback limit without raw database text", () => {
    const msg = friendlyDbError({ code: "P0001", message: "rate_limited:feedback:5" });
    expect(msg).toContain("5 suggestions");
    expect(msg).not.toContain("rate_limited");
  });
});

describe("cookie consent", () => {
  it("only accepts the two known choices", () => {
    expect(parseConsent("ads")).toBe("ads");
    expect(parseConsent("essential")).toBe("essential");
    for (const bad of ["", "yes", "ADS", null, undefined]) expect(parseConsent(bad as string | null)).toBeNull();
    expect(CONSENT_COOKIE).toBe("persist-consent");
  });
});

describe("changelog", () => {
  it("formats dates deterministically", () => {
    expect(formatChangelogDate("2026-10-14")).toBe("14 Oct 2026");
    expect(formatChangelogDate("2026-01-05")).toBe("5 Jan 2026");
  });
  it("is newest first and every entry has content", () => {
    const dates = CHANGELOG.map((c) => c.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const c of CHANGELOG) expect(c.title.length > 3 && c.detail.length > 10).toBe(true);
  });
});
