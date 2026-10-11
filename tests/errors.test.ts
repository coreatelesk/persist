import { describe, expect, it, vi } from "vitest";
import { friendlyDbError } from "@/lib/db-errors";
import { taglineLines } from "@/lib/brand";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("friendlyDbError", () => {
  it("explains the monthly creation limit", () => {
    expect(friendlyDbError({ code: "P0001", message: "limit_reached:habits:20" })).toContain("limit of 20 new habits");
    expect(friendlyDbError({ message: "limit_reached:challenges:10" })).toContain("limit of 10 new challenges");
  });
  it("points setup problems at the migrations", () => {
    expect(friendlyDbError({ code: "42501", message: "permission denied for table habits" })).toContain("migrations");
  });
});

describe("brand", () => {
  it("splits a tagline into stacked lines", () => {
    expect(taglineLines("Show up. Leave proof.")).toEqual(["Show up.", "Leave proof."]);
  });
});
