/**
 * ADMIN_EMAILS: comma-separated lowercase entries; runtime match is case-insensitive.
 * Empty or unset means any authenticated user may use admin (pilot default).
 */
export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True if this session email may use admin (call after confirming a session exists). */
export function isUserAllowedForAdmin(email: string | null | undefined): boolean {
  const list = getAdminEmailAllowlist();
  if (list.length === 0) {
    return true;
  }
  if (!email?.trim()) return false;
  return list.includes(email.trim().toLowerCase());
}
