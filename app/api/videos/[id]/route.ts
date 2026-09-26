import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";
import {
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideoBySlug,
} from "@/supabase/modules/videos";
import { validateVideoInput } from "@/lib/video-validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const video = await getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    return NextResponse.json({ video });
  } catch (error) {
    console.error("GET /api/videos/[id] error:", error);
    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getVideoById(id);
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json();
    const { valid, errors, value } = validateVideoInput(body, { partial: true });
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }

    if (value.slug && value.slug !== existing.slug) {
      const clash = await getVideoBySlug(value.slug);
      if (clash && clash.id !== id) {
        return NextResponse.json(
          { error: "Invalid input", details: { slug: "This slug is already in use" } },
          { status: 409 }
        );
      }
    }

    const video = await updateVideo(id, value);
    if (!video) {
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("PATCH /api/videos/[id] error:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getVideoById(id);
    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const ok = await deleteVideo(id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/videos/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
