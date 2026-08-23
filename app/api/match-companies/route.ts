import { NextResponse } from "next/server";
import { getArticleById } from "@/supabase/CRUD/queries";
import { getSupabaseAdminClient } from "@/supabase/supabase";
import { CompanySuggestion } from "@/types/article-company";
import { checkAuthStatusServer } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

const CHUNK_SIZE = 50;
const MAX_COMPANIES = 300;
const MIN_CONFIDENCE = 40;

export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await getArticleById(articleId);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const admin = getSupabaseAdminClient();
    const { data: companies, error: companiesError } = await admin
      .from("featured_startups")
      .select("id, name, description, industry, tags")
      .order("name", { ascending: true })
      .limit(MAX_COMPANIES);

    if (companiesError) {
      console.error("Failed to fetch companies:", companiesError);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    const bestByCompany = new Map<string, CompanySuggestion>();
    const companyNameById = new Map<string, string>();

    for (let i = 0; i < (companies || []).length; i += CHUNK_SIZE) {
      const chunk = companies!.slice(i, i + CHUNK_SIZE);
      chunk.forEach((c) => companyNameById.set(c.id, c.name));

      try {
        const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/match-companies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.WORKER_API_KEY || "",
          },
          body: JSON.stringify({
            article: {
              title: article.title,
              summary: article.summary,
              content: article.content,
            },
            companies: chunk,
          }),
        });

        const aiData = await aiRes.json().catch(() => ({}));

        if (!aiRes.ok || !Array.isArray(aiData.matches)) {
          console.error("AI match chunk failed:", aiData.error || aiRes.status);
          continue;
        }

        for (const m of aiData.matches as CompanySuggestion[]) {
          if (!m.company_id || m.confidence < MIN_CONFIDENCE) continue;
          const existing = bestByCompany.get(m.company_id);
          if (!existing || m.confidence > existing.confidence) {
            bestByCompany.set(m.company_id, {
              ...m,
              name: companyNameById.get(m.company_id),
            });
          }
        }
      } catch (chunkErr) {
        console.error("AI match chunk error:", chunkErr);
      }
    }

    const matches = Array.from(bestByCompany.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 25);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Failed to match companies:", error);
    return NextResponse.json({ error: "Failed to match companies" }, { status: 500 });
  }
}
