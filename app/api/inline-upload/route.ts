import { NextRequest, NextResponse } from "next/server";
import { createAsset } from "@/supabase/CRUD/queries";
import { addArticleAsset } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

const UPLOADS_WORKER_URL = (
  process.env.NEXT_PUBLIC_UPLOADS_WORKER_URL || "http://localhost:8790"
).replace(/\/+$/, "");

function logStep(step: string, extra?: unknown) {
  console.log(`[inline-upload] ${step}`, extra ? JSON.stringify(extra) : "");
}

export async function POST(request: NextRequest) {
  logStep("1. request received", {
    method: request.method,
    url: request.url,
    workerUrl: UPLOADS_WORKER_URL,
    hasWorkerKey: !!process.env.WORKER_API_KEY,
  });

  try {
    const authResult = await checkAuthStatusServer();
    logStep("2. auth check", { authenticated: authResult.authenticated });
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
      folder = "/article-content",
    } = body;

    logStep("3. body parsed", {
      fileName,
      articleId,
      userId,
      fileType,
      folder,
      fileProvided: !!file,
      fileTypeOf: typeof file,
      fileLength: typeof file === "string" ? file.length : "n/a",
    });

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

    const workerTarget = `${UPLOADS_WORKER_URL}/api/upload`;
    logStep("4. calling uploads worker", {
      target: workerTarget,
      method: "POST",
      contentType: "application/json",
    });

    const uploadRes = await fetch(workerTarget, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({ file, fileName, folder }),
    });

    const rawText = await uploadRes.text();
    logStep("5. worker response", {
      status: uploadRes.status,
      ok: uploadRes.ok,
      contentType: uploadRes.headers.get("content-type"),
      responseLength: rawText.length,
      responsePreview: rawText.slice(0, 300),
    });

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
    logStep("6. worker upload ok", { fileUrl });

    const asset = await createAsset({
      name: fileName,
      url: fileUrl,
      type: fileType,
      author_id: userId,
    });
    logStep("7. asset created", { assetId: asset?.id, ok: !!asset });

    if (!asset) {
      return NextResponse.json(
        { error: "Failed to create asset" },
        { status: 500 }
      );
    }

    if (articleId && asset.id) {
      await addArticleAsset(articleId, asset.id);
      logStep("8. linked asset to article", { articleId, assetId: asset.id });
    } else {
      logStep("8. skipped article link", { articleId, assetId: asset.id });
    }

    logStep("9. success");
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
