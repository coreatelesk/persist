import { describe, expect, it } from "vitest";
import { addDays, diffDays, isDateKey, mondayIndex, startOfWeek, todayIn } from "@/lib/dates";

describe("date keys", () => {
  it("validates real calendar dates only", () => {
    expect(isDateKey("2026-10-10")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("10/10/2026")).toBe(false);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(diffDays("2026-10-01", "2026-10-10")).toBe(9);
  });

  it("starts weeks on Monday", () => {
    expect(mondayIndex("2026-10-12")).toBe(0); // Monday
    expect(startOfWeek("2026-10-10")).toBe("2026-10-05"); // Saturday -> Monday
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // Sunday -> Monday
  });
});

describe("todayIn", () => {
  it("uses the visitor's time zone, not the server's", () => {
    const instant = new Date("2026-10-09T20:30:00Z"); // 02:00 on the 10th in Mumbai
    expect(todayIn("Asia/Kolkata", instant)).toBe("2026-10-10");
    expect(todayIn("UTC", instant)).toBe("2026-10-09");
    expect(todayIn("America/Los_Angeles", instant)).toBe("2026-10-09");
  });

  it("falls back to UTC for an unknown zone", () => {
    expect(todayIn("Not/AZone", new Date("2026-10-09T20:30:00Z"))).toBe("2026-10-09");
  });
});
