import { cookies } from "next/headers";
import { AuthResult } from "./auth";

export const getAuthUrl = (): string => {
  return process.env.NEXT_PUBLIC_AUTH_URL || "";
};

// Server-side auth check (for server components)
export const checkAuthStatusServer = async (): Promise<AuthResult> => {
  const authUrl = getAuthUrl();
  
  if (!authUrl) {
    console.warn("Auth URL not configured");
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
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${authUrl}/api/auth/status`, {
      method: "GET",
      headers: {
        "Cookie": cookieHeader,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      authenticated: data.authenticated || false,
      user: data.user || null,
      role: data.role || null,
      profilePicture: data.profilePicture || null,
      isAdmin: data.isAdmin || false,
    };
  } catch (error) {
    console.error("Error checking auth status:", error);
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