import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const cookieHeader = cookieStore.toString();

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    
    if (!authUrl) {
      return NextResponse.json(
        { authenticated: false, error: "Auth URL not configured" },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { authenticated: false, error: `Auth check failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
