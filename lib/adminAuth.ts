import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { isUserAllowedForAdmin } from "@/lib/adminEmailAllowlist";
import { requireAuth } from "@/lib/requireAuth";

export { getAdminEmailAllowlist, isUserAllowedForAdmin } from "@/lib/adminEmailAllowlist";

/** Require session + optional admin allowlist; 401 then 403. */
export async function requireAdmin(): Promise<
  | { ok: true; user: NonNullable<Session["user"]> }
  | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;
  const email = authResult.user.email;
  if (!isUserAllowedForAdmin(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return authResult;
}
