import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public admin routes
  if (pathname === "/admin/login") {
    // If already authenticated, send straight to the dashboard.
    const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (ok) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
