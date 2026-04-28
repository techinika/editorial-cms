import { NextRequest, NextResponse } from "next/server";
import { createAsset } from "@/supabase/CRUD/querries";
import { addArticleAsset } from "@/supabase/CRUD/querries";

export async function POST(request: NextRequest) {
  try {
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

    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/upload-auth`
    );
    const authData = await authResponse.json();

    const { upload } = await import("@imagekit/next");
    const result = await upload({
      file,
      fileName,
      folder,
      publicKey: authData.publicKey,
      token: authData.token,
      signature: authData.signature,
      expire: authData.expire,
    });

    const fileUrl = (result as any)?.url;
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Failed to upload video" },
        { status: 500 }
      );
    }

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