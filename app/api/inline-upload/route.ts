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

    // Get ImageKit auth params
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/upload-auth`
    );
    const authData = await authResponse.json();

    // Upload to ImageKit
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

    const imageUrl = (result as any)?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Create asset in database
    const asset = await createAsset({
      name: fileName,
      url: imageUrl,
      type: "image",
      author_id: userId,
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      );
    }

    // If articleId is provided, record the asset-article relationship
    if (articleId && asset.id) {
      await addArticleAsset(articleId, asset.id);
    }

    return NextResponse.json({
      url: imageUrl,
      assetId: asset.id,
      asset,
    });
  } catch (error) {
    console.error("Inline image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}