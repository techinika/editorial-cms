import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";
import { searchArticleOptions } from "@/supabase/modules/articleOptions";

/**
 * Typeahead for the video form's "related article" combobox.
 *
 * Server-side rather than a direct table read from the client, for the same
 * reason the video list is: the CMS's only data key is the anon key, and using
 * it here would both widen what is readable with it and hide drafts from the
 * editor who is trying to link one.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!isAuthorizedEditor(authResult)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";

    return NextResponse.json({ articles: await searchArticleOptions(q) });
  } catch (error) {
    console.error("GET /api/articles/search error:", error);
    return NextResponse.json(
      { error: "Failed to search articles" },
      { status: 500 }
    );
  }
}
