import { describe, expect, it } from "vitest";
import { isValidMobile, normalizeMobile, profileSchema } from "@/lib/validation";

describe("mobile number validation", () => {
  it("accepts blank (the field is optional) and common formats", () => {
    for (const ok of ["", "   ", "+919876543210", "+91 98765 43210", "98765-43210", "(022) 2345 6789", "9876543210"]) {
      expect(isValidMobile(ok), ok).toBe(true);
    }
  });
  it("rejects letters, too few digits, and too many digits", () => {
    for (const bad of ["abc", "98765abc43210", "12345", "+1234567890123456", "++919876543210", "98765 43210 ext 5"]) {
      expect(isValidMobile(bad), bad).toBe(false);
    }
  });
  it("normalises to digits with an optional leading +", () => {
    expect(normalizeMobile(" +91 98765-43210 ")).toBe("+919876543210");
    expect(normalizeMobile("(022) 2345 6789")).toBe("02223456789");
  });
  it("profile schema stores normalised numbers and blocks junk", () => {
    expect(profileSchema.parse({ displayName: " Riya ", mobile: "+91 98765 43210" })).toEqual({ displayName: "Riya", mobile: "+919876543210" });
    expect(profileSchema.parse({ displayName: "", mobile: "" }).mobile).toBe("");
    expect(profileSchema.safeParse({ displayName: "x", mobile: "abc" }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: "x".repeat(61), mobile: "" }).success).toBe(false);
  });
});
