import type { Session } from "next-auth";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Returns 401 JSON if there is no signed-in user. */
export async function requireAuth(): Promise<
  | { ok: true; user: NonNullable<Session["user"]> }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user: session.user };
}
