export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

export interface AuthResult {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  role: string | null;
  profilePicture: string | null;
  isAdmin: boolean;
  error?: string;
}

export const getAuthUrl = (): string => {
  return process.env.NEXT_PUBLIC_AUTH_URL || "";
};

// Client-side auth check (for client components)
export const checkAuthStatus = async (): Promise<AuthResult> => {
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
    const response = await fetch(`${authUrl}/api/auth/status`, {
      method: "GET",
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

export const logout = async (): Promise<void> => {
  const authUrl = getAuthUrl();
  
  if (!authUrl) return;

  try {
    await fetch(`${authUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Error logging out:", error);
  }
};
