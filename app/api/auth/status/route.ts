import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log("[auth-status] Received cookies:", allCookies.map(c => c.name));

    if (allCookies.length === 0) {
      console.log("[auth-status] No cookies found in request");
    }

    const cookieHeader = cookieStore.toString();
    console.log("[auth-status] Cookie header length:", cookieHeader.length);

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    
    if (!authUrl) {
      console.error("[auth-status] Auth URL not configured");
      return NextResponse.json(
        { authenticated: false, error: "Auth URL not configured" },
        { status: 500 }
      );
    }

    console.log("[auth-status] Calling auth app:", `${authUrl}/api/auth/status`);

    const response = await fetch(`${authUrl}/api/auth/status`, {
      method: "GET",
      headers: {
        "Cookie": cookieHeader,
        "Accept": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[auth-status] Auth API returned ${response.status}: ${errorText}`);
      return NextResponse.json(
        { authenticated: false, error: `Auth check failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[auth-status] Auth check result:", {
      authenticated: data.authenticated,
      role: data.role,
      hasUser: !!data.user
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[auth-status] Error checking auth status:", error);
    return NextResponse.json(
      { authenticated: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
