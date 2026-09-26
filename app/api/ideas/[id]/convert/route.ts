import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAdminOnly } from "@/lib/auth-server";
import { getIdeaById } from "@/supabase/modules/ideas";
import { convertIdeaToArticle } from "@/supabase/modules/ideaConversion";
import { canConvert, isAssignedTo } from "@/lib/idea";

type Params = { params: Promise<{ id: string }> };

/**
 * Convert an idea into a real draft article.
 *
 * This is the one ideas action an author may perform, and only on an idea
 * assigned to them: a draft is created in `articles` with author_id taken from
 * the assignee, content_type and partner_id carried over, and the idea linked
 * back and moved to "draft".
 *
 * Deliberately NOT admin-only — that's the point of assigning an idea. But an
 * admin can also convert on an author's behalf, which is useful when someone
 * is unavailable; the article still belongs to the assignee either way.
 */
export async function POST(_request: NextRequest, { params }: Params) {
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

    const isAdmin = isAdminOnly(auth);
    const isAssignee = isAssignedTo(idea, auth.user.id);
    if (!isAdmin && !isAssignee) {
      return NextResponse.json(
        { error: "This idea is not assigned to you" },
        { status: 403 }
      );
    }

    // Reject early with a useful message rather than letting the insert fail.
    const check = canConvert(idea);
    if (!check.ok) {
      const code = idea.article_id ? "already_converted" : "unassigned";
      return NextResponse.json({ error: check.reason, code }, { status: 409 });
    }

    const result = await convertIdeaToArticle(idea);
    if (!result.ok) {
      const status = result.code === "not_found" ? 404 : 409;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }

    return NextResponse.json(
      { article: result.article, idea: result.idea },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ideas/[id]/convert error:", error);
    return NextResponse.json(
      { error: "Could not create the article" },
      { status: 500 }
    );
  }
}
