import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAdminOnly } from "@/lib/auth-server";
import { deleteIdea, getIdeaById, updateIdea } from "@/supabase/modules/ideas";
import { validateIdeaInput } from "@/lib/idea-validation";
import { isAssignedTo } from "@/lib/idea";

type Params = { params: Promise<{ id: string }> };

/**
 * Read one idea.
 *
 * An admin can read any idea; an author can read only one assigned to them. The
 * idea carries a lead's contact details, so this is checked per row rather than
 * relying on the list endpoint's filter.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idea = await getIdeaById(id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    if (!isAdminOnly(auth) && !isAssignedTo(idea, auth.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ idea });
  } catch (error) {
    console.error("GET /api/ideas/[id] error:", error);
    return NextResponse.json({ error: "Failed to load the idea" }, { status: 500 });
  }
}

/**
 * Update an idea. Admin-only.
 *
 * Partial: only the keys present in the body are written, so the board can
 * move a card between stages without resending the whole record.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { valid, errors, value } = validateIdeaInput(body, { partial: true });
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }
    if (Object.keys(value).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const idea = await updateIdea(id, value);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return NextResponse.json({ idea });
  } catch (error) {
    console.error("PATCH /api/ideas/[id] error:", error);
    return NextResponse.json({ error: "Failed to update the idea" }, { status: 500 });
  }
}

/**
 * Delete an idea. Admin-only.
 *
 * The article it produced is left alone — `article_ideas.article_id` is
 * ON DELETE SET NULL, so deleting the idea detaches the link rather than
 * taking the published article with it. Delete the article separately if that
 * is what you want.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const ok = await deleteIdea(id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to delete the idea" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ideas/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete the idea" }, { status: 500 });
  }
}
