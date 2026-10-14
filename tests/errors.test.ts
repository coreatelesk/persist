import { describe, expect, it, vi } from "vitest";
import { friendlyDbError } from "@/lib/db-errors";
import { isLimitKind, limitReachedMessage } from "@/lib/limit-messages";
import { taglineLines } from "@/lib/brand";
import { getAdsConfig } from "@/lib/ads/config";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("limit messages tell people what to do next", () => {
  it("explains each Free-plan limit from the database error", () => {
    expect(friendlyDbError({ code: "P0001", message: "limit_reached:active_habits:10" })).toMatch(/10 active habits.*Archive or delete/);
    expect(friendlyDbError({ message: "limit_reached:active_challenges:10" })).toMatch(/10 active challenges.*Finish, archive, or delete/);
    expect(friendlyDbError({ message: "limit_reached:archived_habits:20" })).toMatch(/archive is full.*20 archived habits.*Delete.*restore/i);
    expect(friendlyDbError({ message: "limit_reached:archived_challenges:20" })).toMatch(/archive is full.*20 archived challenges/i);
  });
  it("never leaks raw database text", () => {
    for (const msg of ["limit_reached:active_habits:10", "permission denied for table habits", "weird internal failure"]) {
      const out = friendlyDbError({ code: "XX000", message: msg });
      expect(out).not.toContain("limit_reached");
      expect(out).not.toContain("permission denied");
    }
  });
  it("no longer knows about monthly quotas", () => {
    expect(isLimitKind("habits")).toBe(false);
    expect(limitReachedMessage("active_habits", 10)).not.toMatch(/month/i);
  });
  it("points setup problems at the migrations", () => {
    expect(friendlyDbError({ code: "42501", message: "permission denied for table habits" })).toContain("migrations");
    expect(friendlyDbError({ code: "PGRST202", message: "function not found" })).toContain("migrations");
  });
  it("hides admin-only failures behind a plain message", () => {
    expect(friendlyDbError({ code: "42501", message: "forbidden" })).toBe("You don't have permission to do that.");
  });
});

describe("brand", () => {
  it("splits a tagline into stacked lines", () => {
    expect(taglineLines("Show up. Leave proof.")).toEqual(["Show up.", "Leave proof."]);
  });
});

describe("ads configuration is off unless fully and validly configured", () => {
  const keys = ["NEXT_PUBLIC_ADS_ENABLED", "NEXT_PUBLIC_ADS_PROVIDER", "NEXT_PUBLIC_ADSENSE_CLIENT", "NEXT_PUBLIC_ADSENSE_SLOT"] as const;
  const withEnv = (env: Partial<Record<(typeof keys)[number], string>>, fn: () => void) => {
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    keys.forEach((k) => delete process.env[k]);
    Object.assign(process.env, env);
    try { fn(); } finally { keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))); }
  };
  const good = { NEXT_PUBLIC_ADS_ENABLED: "true", NEXT_PUBLIC_ADSENSE_CLIENT: "ca-pub-1234567890123456", NEXT_PUBLIC_ADSENSE_SLOT: "1234567890" };

  it("is disabled by default and when the flag is not exactly true", () => {
    withEnv({}, () => expect(getAdsConfig()).toBeNull());
    withEnv({ ...good, NEXT_PUBLIC_ADS_ENABLED: "yes" }, () => expect(getAdsConfig()).toBeNull());
  });
  it("is disabled when credentials are missing or malformed", () => {
    withEnv({ NEXT_PUBLIC_ADS_ENABLED: "true" }, () => expect(getAdsConfig()).toBeNull());
    withEnv({ ...good, NEXT_PUBLIC_ADSENSE_CLIENT: "pub-123" }, () => expect(getAdsConfig()).toBeNull());
    withEnv({ ...good, NEXT_PUBLIC_ADSENSE_SLOT: "abc" }, () => expect(getAdsConfig()).toBeNull());
    withEnv({ ...good, NEXT_PUBLIC_ADSENSE_CLIENT: "YOUR_PUBLISHER_ID" }, () => expect(getAdsConfig()).toBeNull());
  });
  it("is disabled for an unknown provider", () => {
    withEnv({ ...good, NEXT_PUBLIC_ADS_PROVIDER: "mystery" }, () => expect(getAdsConfig()).toBeNull());
  });
  it("is enabled only with valid AdSense settings", () => {
    withEnv(good, () => expect(getAdsConfig()).toEqual({ provider: "adsense", client: "ca-pub-1234567890123456", slot: "1234567890" }));
  });
});
