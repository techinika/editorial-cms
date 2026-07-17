import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

const publicPaths = ["/api/", "/_next/", "/favicon"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("sb-refresh-token")?.value;

  if (!sessionCookie && authUrl) {
    const loginUrl = `${authUrl}/status?redirect=${encodeURIComponent(baseUrl + pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
