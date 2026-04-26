import { NextResponse } from "next/server";
import puter from "@heyputer/puter.js";
import { createFeedback, getArticleById } from "@/supabase/CRUD/querries";

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

    const prompt = `You are an expert article reviewer. Analyze the following article and provide 5 constructive feedback points that would help improve it. Each feedback should be specific, actionable, and helpful.

Article Title: ${article.title}
Article Content: ${article.content ? article.content.substring(0, 8000) : 'No content'}

Provide exactly 5 feedback points, one per line, each starting with a bullet point (-). Each feedback should be 1-2 sentences maximum and focused on improving the article. Be specific and constructive.`;

    const response = await puter.ai.chat(prompt, {
      model: "gpt-4.1-nano"
    });

    const feedbackText = response || "";
    const feedbackLines = feedbackText.split("\n").filter((line: string) => line.trim());
    
    const feedbackPoints = feedbackLines
      .filter((line: string) => line.includes("-") || line.includes("."))
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