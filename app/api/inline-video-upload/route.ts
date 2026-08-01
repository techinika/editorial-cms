import { NextRequest, NextResponse } from "next/server";
import { createAsset } from "@/supabase/CRUD/queries";
import { addArticleAsset } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

const UPLOADS_WORKER_URL = (
  process.env.NEXT_PUBLIC_UPLOADS_WORKER_URL || "http://localhost:8790"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      file, 
      fileName, 
      articleId, 
      userId, 
      folder = "/article-content" 
    } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and fileName are required" },
        { status: 400 }
      );
    }

    const uploadRes = await fetch(`${UPLOADS_WORKER_URL}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({ file, fileName, folder }),
    });

    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok || !uploadData.url) {
      return NextResponse.json(
        { error: uploadData.error || "Failed to upload video" },
        { status: uploadRes.ok ? 500 : uploadRes.status }
      );
    }

    const fileUrl = uploadData.url;

    const asset = await createAsset({
      name: fileName,
      url: fileUrl,
      type: "video",
      author_id: userId,
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      );
    }

    if (articleId && asset.id) {
      await addArticleAsset(articleId, asset.id);
    }

    return NextResponse.json({
      url: fileUrl,
      assetId: asset.id,
      asset,
    });
  } catch (error) {
    console.error("Inline video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
