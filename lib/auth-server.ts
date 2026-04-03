import { cookies } from "next/headers";
import { AuthResult } from "./auth";
import { redirect } from "next/navigation";

export const getAuthUrl = (): string => {
  return process.env.NEXT_PUBLIC_AUTH_URL || "";
};

export const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
};

// Check if user is authenticated as author, redirect if not
export const requireAuthor = (
  authResult: AuthResult,
  redirectPath?: string,
): void => {
  if (!authResult.authenticated || authResult.role !== "author") {
    const authUrl = getAuthUrl();
    const baseUrl = getBaseUrl() || "http://localhost:3001";
    const destination = redirectPath || "/";
    const loginUrl = `${authUrl}/status?redirect=${encodeURIComponent(baseUrl)}${destination}`;
    redirect(loginUrl);
  }
};

// Server-side auth check (for server components)
export const checkAuthStatusServer = async (): Promise<AuthResult> => {
  const authUrl = getAuthUrl();
  
  if (!authUrl) {
    console.error("[checkAuthStatusServer] Auth URL not configured");
    return {
      authenticated: false,
      user: null,
      role: null,
      profilePicture: null,
      isAdmin: false,
      error: "Auth URL not configured",
    };
  }

  try {
    // Get cookies from the current request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    
    console.log("[checkAuthStatusServer] Cookie header (first 100 chars):", cookieHeader.substring(0, 100));

    // Call the auth app directly with cookies
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
      console.error(`[checkAuthStatusServer] Auth API returned ${response.status}: ${errorText}`);
      throw new Error(`Auth check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("[checkAuthStatusServer] Auth result:", {
      authenticated: data.authenticated,
      role: data.role,
      hasUser: !!data.user
    });
    
    return {
      authenticated: data.authenticated || false,
      user: data.user || null,
      role: data.role || null,
      profilePicture: data.profilePicture || null,
      isAdmin: data.isAdmin || false,
    };
  } catch (error) {
    console.error("[checkAuthStatusServer] Error checking auth status:", error);
    return {
      authenticated: false,
      user: null,
      role: null,
      profilePicture: null,
      isAdmin: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
