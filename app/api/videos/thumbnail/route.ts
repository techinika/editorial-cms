import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";

const UPLOADS_WORKER_URL = (
  process.env.NEXT_PUBLIC_UPLOADS_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

/** PostgREST body limits and R2 puts both make oversized images pointless here. */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Only ever store a real http(s) URL — never a javascript: or data: payload. */
function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Uploads a video thumbnail to the uploads worker and returns the stored URL.
 *
 * Deliberately does *not* create a row in `assets`, the way /api/inline-upload
 * does. A thumbnail belongs to one video and is rendered on the watch page and
 * in cards; putting it in the shared media library would leave an orphan row
 * that the asset manager lists but nothing references. `videos.thumbnail` is a
 * plain URL column, so that's all the row needs.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAuthorizedEditor(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { file, fileName } = body ?? {};

    if (typeof file !== "string" || !file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Accept both a bare base64 payload and a full data URL, and take the mime
    // type from the data URL when present so an editor can't pass a .exe named
    // .jpg and have it stored as an image.
    const dataUrl = file.match(/^data:([^;,]+)?(;base64)?,([\s\S]+)$/);
    const mime = dataUrl?.[1]?.trim().toLowerCase();
    const base64 = dataUrl ? dataUrl[3] : file;

    if (!mime || !ALLOWED_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Thumbnail must be a JPG, PNG, WebP, GIF or AVIF image" },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
      return NextResponse.json({ error: "Malformed image data" }, { status: 400 });
    }

    // ~4/3 overhead from base64, so this checks the decoded size without
    // allocating a copy of the whole buffer just to measure it.
    const approxBytes = Math.floor((base64.replace(/\s/g, "").length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "Thumbnail must be 5 MB or smaller" },
        { status: 400 }
      );
    }

    const ext = EXT_BY_TYPE[mime];
    const safeName =
      typeof fileName === "string" && fileName.trim()
        ? fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60)
        : `thumbnail.${ext}`;
    const name = safeName.toLowerCase().endsWith(`.${ext}`)
      ? safeName
      : `${safeName}.${ext}`;

    const uploadRes = await fetch(`${UPLOADS_WORKER_URL}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        file: `data:${mime};base64,${base64}`,
        fileName: name,
        folder: "/video-thumbnails",
      }),
    });

    const rawText = await uploadRes.text();
    let uploadJson: Record<string, unknown> = {};
    try {
      uploadJson = JSON.parse(rawText);
    } catch {
      uploadJson = {};
    }

    const url = safeUrl(uploadJson.url);
    if (!uploadRes.ok || !url) {
      console.error("Thumbnail upload worker error:", {
        status: uploadRes.status,
        body: rawText.slice(0, 300),
      });
      return NextResponse.json(
        { error: "Failed to upload the thumbnail" },
        { status: uploadRes.ok ? 500 : uploadRes.status }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload the thumbnail" },
      { status: 500 }
    );
  }
}
