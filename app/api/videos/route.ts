import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";
import {
  listVideos,
  createVideo,
  getVideoBySlug,
  getVideoCategories,
} from "@/supabase/modules/videos";
import { validateVideoInput, normaliseVideoInput } from "@/lib/video-validation";
import { resolvePublishState, readIntent } from "@/lib/video";
import type { VideoStatus, VideoInput } from "@/types/video";

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;

    if (searchParams.get("categories") === "1") {
      return NextResponse.json({ categories: await getVideoCategories() });
    }

    const statusParam = searchParams.get("status");
    const status =
      statusParam === "draft" ||
      statusParam === "published" ||
      statusParam === "archived"
        ? (statusParam as VideoStatus)
        : "all";

    const { videos, total } = await listVideos({
      search: searchParams.get("search") || undefined,
      status,
      categoryId: searchParams.get("category") || undefined,
      page: Number(searchParams.get("page")) || 1,
      pageSize: Math.min(Number(searchParams.get("pageSize")) || 25, 100),
    });

    return NextResponse.json({ videos, total });
  } catch (error) {
    console.error("GET /api/videos error:", error);
    return NextResponse.json(
      { error: "Failed to load videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { valid, errors } = validateVideoInput(body, { partial: false });
    if (!valid) {
      return NextResponse.json({ error: "Invalid input", details: errors }, { status: 400 });
    }

    const input = normaliseVideoInput(body);

    // status + published_at come from the button, applied here so the client
    // can never name its own status or supply its own publish date.
    const intent = readIntent(body);
    if (!intent) {
      return NextResponse.json(
        { error: "Invalid input", details: { intent: "Unknown save action" } },
        { status: 400 }
      );
    }
    const state = resolvePublishState(intent, null);
    const row: VideoInput = { ...input, ...state };

    // Catch the duplicate-slug case up front so the editor gets a field-level
    // message instead of a raw Postgres unique-violation bubbling out of the
    // module as a 500.
    const existing = await getVideoBySlug(row.slug);
    if (existing) {
      return NextResponse.json(
        { error: "Invalid input", details: { slug: "This slug is already in use" } },
        { status: 409 }
      );
    }

    const video = await createVideo(row);
    if (!video) {
      return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("POST /api/videos error:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
