import { NextResponse } from "next/server";
import puter from "@heyputer/puter.js";
import { createFeedback, getArticleById } from "@/supabase/CRUD/querries";

const EDITORIAL_GUIDELINES = `
Techinika Editorial Guidelines v1.0

These guidelines ensure all articles are accurate, readable, original, and professional:

1. Writing Style: 
- Each paragraph must be 5 lines or fewer
- Avoid long blocks of text
- Use clear language, avoid jargon

2. Accuracy & Sources:
- Always use original sources (official announcements, websites)
- Verify dates, names, URLs, claims before publishing
- Include sources section at bottom

3. Originality:
- Do not copy other articles
- Add value: context, technical explanation, impact analysis

4. Headers:
- Structure with: Introduction, What Happened, Why It Matters, Key Details, Sources

5. Dates:
- Use exact dates: "April 8, 2026"
- Avoid "yesterday", "today"

6. Technology Relevance:
- Only publish tech-related stories
- Show technical impact

7. Quality Checklist:
- Paragraphs ≤ 5 lines
- Sources included
- Official links added
- No exaggeration
- No duplicate content
- Headers used
`;

export async function POST(request: Request) {
  try {
    const { articleId, authorId } = await request.json();

    if (!articleId || !authorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await getArticleById(articleId);
    
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const prompt = `You are an expert article reviewer for Techinika, a technology media platform. 
Analyze the following article and provide exactly 5 constructive feedback points using the Techinika Editorial Guidelines.

${EDITORIAL_GUIDELINES}

Article Title: ${article.title}
Article Content: ${article.content ? article.content.substring(0, 8000) : 'No content'}

Provide exactly 5 feedback points, one per line, each starting with a bullet point (-). 
Each feedback should be 1-2 sentences, specific, actionable, and reference the guidelines above.
Focus on: content quality, structure, accuracy, headers, sources, dates, readability, technology relevance.`;

    const response = await puter.ai.chat(prompt, {
      model: "gpt-4.1-nano"
    });

    const feedbackText = response || "";
    const feedbackLines = feedbackText.split("\n").filter((line: string) => line.trim());
    
    const feedbackPoints = feedbackLines
      .filter((line: string) => line.includes("-") || (line.match(/^\d+\./) && line.length > 20))
      .slice(0, 5);

    const results = [];
    for (const feedback of feedbackPoints) {
      let content = feedback.replace(/^[-.\d.]+\s*/, "").trim();
      content = content.replace(/^[A-Z]:\s*/, "").trim();
      
      if (content.length > 10 && content.length < 500) {
        const result = await createFeedback(articleId, authorId, content, true);
        if (result) {
          results.push(result);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}