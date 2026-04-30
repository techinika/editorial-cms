import { NextResponse } from "next/server";
import puter from "@heyputer/puter.js";
import { createFeedback, getArticleById } from "@/supabase/CRUD/queries";
import { blocksToHtml } from "@/lib/content-parser";
import { Block } from "@/types/article";

const EDITORIAL_GUIDELINES = `
Techinika Editorial Guidelines v1.0

1. Writing Style: 
- Each paragraph ≤ 5 lines
- Use clear language, no jargon

2. Accuracy:
- Use original sources (official websites)
- Verify dates, names, URLs
- Include sources at bottom (if needed)

3. Originality:
- Do not copy other articles
- Add unique context/explanation

4. Structure:
- Use headers: Introduction, What Happened, Why It Matters, Key Details, Sources

5. Dates:
- Use exact dates: "April 8, 2026"
- No "yesterday"/"today"

6. Tech Relevance:
- Only tech-focused content
`;

interface PuterError {
  message: string;
  code: string;
}

function isPuterError(response: unknown): response is PuterError {
  return typeof response === 'object' && response !== null && 'code' in response;
}

export async function POST(request: Request) {
  try {
    const puterAuthToken = process.env.PUTER_AUTH_TOKEN;
    
    if (!puterAuthToken) {
      return NextResponse.json({ error: "Puter AI not configured. Set PUTER_AUTH_TOKEN env variable." }, { status: 500 });
    }
    
    puter.setAuthToken(puterAuthToken);
    
    const { articleId, authorId } = await request.json();
    
    if (!articleId || !authorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const article = await getArticleById(articleId);
    
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    
    // Use blocks with asset URLs if available, otherwise fall back to content
    let articleContent = '';
    if (article.blocks && Array.isArray(article.blocks) && article.blocks.length > 0) {
      const assetUrlMap = (article as any).assetUrlMap || {};
      articleContent = blocksToHtml(article.blocks as Block[], assetUrlMap);
    } else {
      articleContent = article.content || 'No content';
    }
    
    const prompt = `You are an expert article reviewer for Techinika, a technology media platform. 
Analyze the following article and provide exactly 5 constructive feedback points using the Techinika Editorial Guidelines.

${EDITORIAL_GUIDELINES}

Article Title: ${article.title}
Article Content: ${articleContent.substring(0, 8000)}

Provide exactly 5 feedback points as a numbered list (1. to 5.). 
Each feedback should be 1-2 sentences, specific, actionable, and reference the guidelines above.
Focus on: content quality, structure, accuracy, headers, sources, dates, readability, technology relevance.`;
    
    console.log("Calling Puter AI with prompt...");
    
    const response = await puter.ai.chat(prompt, {
      model: "gpt-4.1-nano"
    });
    
    console.log("AI raw response:", response);
    
    if (isPuterError(response)) {
      console.error("Puter API error:", response.message);
      return NextResponse.json({ error: `Puter AI error: ${response.message}` }, { status: 500 });
    }
    
    const feedbackText = String(response || "");
    console.log("Feedback text:", feedbackText);
    
    if (!feedbackText || feedbackText === "undefined") {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }
    
    const feedbackLines = feedbackText.split("\n").filter((line: string) => line.trim());
    console.log("Feedback lines:", feedbackLines);
    
    const feedbackPoints = feedbackLines
      .filter((line: string) => {
        const trimmed = line.trim();
        return trimmed.match(/^\d+[.)]/) || trimmed.startsWith("-") || trimmed.length > 30;
      })
      .slice(0, 5);
    
    console.log("Parsed feedback points:", feedbackPoints);
    
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
    
    console.log("Created feedback count:", results.length);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
