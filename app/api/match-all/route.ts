import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/supabase/supabase";
import { checkAuthStatusServer } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

const ARTICLES_LIMIT = 30;
const ARTICLE_BATCH = 15;
const COMPANIES_LIMIT = 150;
const COMPANY_BATCH = 50;
const MIN_CONFIDENCE = 40;

interface BatchPair {
  article_id: string;
  article_title: string;
  company_id: string;
  company_name: string;
  confidence: number;
  reason: string;
}

export async function POST() {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();

    const [{ data: articles }, { data: companies }, { data: existing }] =
      await Promise.all([
        admin
          .from("articles")
          .select("id, title, summary")
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(ARTICLES_LIMIT),
        admin
          .from("featured_startups")
          .select("id, name, description, industry, tags")
          .order("name", { ascending: true })
          .limit(COMPANIES_LIMIT),
        admin
          .from("article_companies")
          .select("article_id, company_id")
          .limit(5000),
      ]);

    if (!articles || articles.length === 0 || !companies || companies.length === 0) {
      return NextResponse.json({ pairs: [] });
    }

    const existingPairs = new Set(
      (existing || []).map((m) => `${m.article_id}:${m.company_id}`)
    );

    const titleByArticle = new Map(articles.map((a) => [a.id, a.title]));
    const nameByCompany = new Map(companies.map((c) => [c.id, c.name]));

    const bestPair = new Map<string, BatchPair>();

    for (let i = 0; i < articles.length; i += ARTICLE_BATCH) {
      const articleChunk = articles.slice(i, i + ARTICLE_BATCH);

      await Promise.all(
        Array.from(
          { length: Math.ceil(companies.length / COMPANY_BATCH) },
          (_, j) => companies.slice(j * COMPANY_BATCH, (j + 1) * COMPANY_BATCH)
        ).map(async (companyChunk) => {
          try {
            const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/match-batch`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.WORKER_API_KEY || "",
              },
              body: JSON.stringify({
                articles: articleChunk,
                companies: companyChunk,
              }),
            });

            const aiData = await aiRes.json().catch(() => ({}));

            if (!aiRes.ok || !Array.isArray(aiData.matches)) {
              console.error("AI batch chunk failed:", aiData.error || aiRes.status);
              return;
            }

            for (const m of aiData.matches) {
              const key = `${m.article_id}:${m.company_id}`;
              if (!m.article_id || !m.company_id || m.confidence < MIN_CONFIDENCE) continue;
              if (existingPairs.has(key)) continue;

              const current = bestPair.get(key);
              if (!current || m.confidence > current.confidence) {
                bestPair.set(key, {
                  article_id: m.article_id,
                  article_title: titleByArticle.get(m.article_id) || "",
                  company_id: m.company_id,
                  company_name: nameByCompany.get(m.company_id) || "",
                  confidence: m.confidence,
                  reason: m.reason,
                });
              }
            }
          } catch (chunkErr) {
            console.error("AI batch chunk error:", chunkErr);
          }
        })
      );
    }

    const pairs = Array.from(bestPair.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 100);

    return NextResponse.json({ pairs });
  } catch (error) {
    console.error("Failed to batch match:", error);
    return NextResponse.json({ error: "Failed to batch match" }, { status: 500 });
  }
}
