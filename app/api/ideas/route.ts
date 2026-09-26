import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAdminOnly } from "@/lib/auth-server";
import {
  createIdea,
  getAssignableAuthors,
  listIdeas,
} from "@/supabase/modules/ideas";
import { getActivePartners } from "@/supabase/modules/partners";
import { validateIdeaInput, IDEA_ERRORS } from "@/lib/idea-validation";
import type { IdeaStatus } from "@/types/idea";

const STATUSES: IdeaStatus[] = [
  "idea",
  "draft",
  "in_progress",
  "pending_publishing",
  "publishing",
  "published",
  "declined",
];

/**
 * Article ideas.
 *
 * GET is not admin-only: an author has to be able to open the pitch assigned to
 * them, because that is where the brief and the lead's contact details live.
 * They see *only* their own — the `assignedTo` filter is taken from the session
 * and any query-string copy of it is ignored, so there is no parameter to
 * tamper with. Everything else (create, reassign, delete) is admin-only.
 *
 * `?meta=1` returns the reference data an admin needs for the board
 * (assignable authors + active partners) in one round trip.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = isAdminOnly(auth);
    const { searchParams } = request.nextUrl;

    if (searchParams.get("meta") === "1") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const [authors, partners] = await Promise.all([
        getAssignableAuthors(),
        getActivePartners(),
      ]);
      return NextResponse.json({ authors, partners });
    }

    const statusParam = searchParams.get("status");
    const status = STATUSES.includes(statusParam as IdeaStatus)
      ? (statusParam as IdeaStatus)
      : "all";

    const { ideas, total } = await listIdeas({
      status,
      search: searchParams.get("search") || undefined,
      // An author is pinned to their own ideas. An admin may filter, but only
      // when they actually pass the parameter.
      assignedTo: isAdmin
        ? searchParams.get("assignedTo") || undefined
        : auth.user.id,
      unassignedOnly: isAdmin && searchParams.get("unassigned") === "1",
      page: Number(searchParams.get("page")) || 1,
      pageSize: Math.min(Number(searchParams.get("pageSize")) || 100, 200),
    });

    return NextResponse.json({ ideas, total });
  } catch (error) {
    console.error("GET /api/ideas error:", error);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { valid, errors, value } = validateIdeaInput(body);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }

    // Stamp who logged the pitch, from the auth session rather than the body.
    const createdBy =
      auth.user?.user_metadata?.full_name || auth.user?.email || null;

    const idea = await createIdea({ ...value, created_by_name: createdBy });
    if (!idea) {
      return NextResponse.json(
        {
          error: "Failed to save the idea",
          details: IDEA_ERRORS.generic,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ idea }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ideas error:", error);
    return NextResponse.json({ error: "Failed to save the idea" }, { status: 500 });
  }
}
