import { getUploadAuthParams } from "@imagekit/next/server";
import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const authResult = await checkAuthStatusServer();
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
  });

  return NextResponse.json({ token, expire, signature, publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY });
}
