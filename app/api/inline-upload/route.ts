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
      fileType = "image",
      folder = "/article-content" 
    } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and fileName are required" },
        { status: 400 }
      );
    }

    if (!["image", "video", "doc"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type" },
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

    const rawText = await uploadRes.text();
    let uploadJson: Record<string, unknown> = {};
    try {
      uploadJson = JSON.parse(rawText);
    } catch {
      uploadJson = {};
    }

    if (!uploadRes.ok || !uploadJson.url) {
      return NextResponse.json(
        {
          error: uploadJson.error || "Failed to upload file",
          status: uploadRes.status,
          bodyPreview: rawText.slice(0, 300),
        },
        { status: uploadRes.ok ? 500 : uploadRes.status }
      );
    }

    const fileUrl = uploadJson.url as string;

    const asset = await createAsset({
      name: fileName,
      url: fileUrl,
      type: fileType,
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
    console.error("Inline upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
