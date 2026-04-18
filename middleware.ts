import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/guide") || path.startsWith("/api/guide");
  if (!isProtected) {
    return NextResponse.next();
  }
  if (req.auth?.user) {
    return NextResponse.next();
  }
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/signin", req.url));
});

export const config = {
  matcher: ["/guide/:path*", "/api/guide/:path*"],
};
