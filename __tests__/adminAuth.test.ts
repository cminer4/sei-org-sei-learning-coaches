import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("admin email allowlist", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats empty ADMIN_EMAILS as permissive (any signed-in user)", async () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    const { getAdminEmailAllowlist, isUserAllowedForAdmin } = await import(
      "@/lib/adminEmailAllowlist"
    );
    expect(getAdminEmailAllowlist()).toEqual([]);
    expect(isUserAllowedForAdmin("any@sei.com")).toBe(true);
    expect(isUserAllowedForAdmin(null)).toBe(true);
  });

  it("parses comma-separated lowercase list", async () => {
    vi.stubEnv("ADMIN_EMAILS", "a@sei.com, b@sei.com ");
    const { getAdminEmailAllowlist } = await import("@/lib/adminEmailAllowlist");
    expect(getAdminEmailAllowlist()).toEqual(["a@sei.com", "b@sei.com"]);
  });

  it("matches email case-insensitively when list is set", async () => {
    vi.stubEnv("ADMIN_EMAILS", "ops@sei.com");
    const { isUserAllowedForAdmin } = await import("@/lib/adminEmailAllowlist");
    expect(isUserAllowedForAdmin("OPS@SeI.Com")).toBe(true);
    expect(isUserAllowedForAdmin("other@sei.com")).toBe(false);
  });

  it("rejects missing email when list is non-empty", async () => {
    vi.stubEnv("ADMIN_EMAILS", "ops@sei.com");
    const { isUserAllowedForAdmin } = await import("@/lib/adminEmailAllowlist");
    expect(isUserAllowedForAdmin(null)).toBe(false);
    expect(isUserAllowedForAdmin(undefined)).toBe(false);
  });
});
