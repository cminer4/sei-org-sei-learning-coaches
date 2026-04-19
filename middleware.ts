import { auth } from "@/auth";
import { isUserAllowedForAdmin } from "@/lib/adminEmailAllowlist";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin") || path.startsWith("/api/admin");
  const isProtected =
    isAdminPath ||
    path.startsWith("/guide") ||
    path.startsWith("/api/guide") ||
    path.startsWith("/api/onboarding") ||
    path === "/api/assessment-summary" ||
    path === "/api/elevenlabs-signed-url" ||
    path === "/api/elevenlabs-conversation-transcript";

  if (!isProtected) {
    return NextResponse.next();
  }
  if (!req.auth?.user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  if (isAdminPath) {
    const email = req.auth.user.email;
    if (!isUserAllowedForAdmin(email)) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/guide/:path*",
    "/api/guide/:path*",
    "/api/onboarding/:path*",
    "/api/assessment-summary",
    "/api/elevenlabs-signed-url",
    "/api/elevenlabs-conversation-transcript",
  ],
};
