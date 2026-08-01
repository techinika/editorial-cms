import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const authResult = await checkAuthStatusServer();
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error:
        "Client-side ImageKit uploads are retired. Upload files via /api/inline-upload instead.",
    },
    { status: 410 }
  );
}
