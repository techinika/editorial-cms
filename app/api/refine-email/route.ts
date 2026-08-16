import { NextResponse } from "next/server";
import { checkAuthStatusServer } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, body } = await request.json();

    if (!subject && !body) {
      return NextResponse.json(
        { error: "Provide subject and/or body to refine" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({ subject, body }),
    });

    const aiData = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: aiData.error || "Failed to refine content" },
        { status: aiRes.ok ? 500 : aiRes.status }
      );
    }

    return NextResponse.json({ subject: aiData.subject, body: aiData.body });
  } catch (error) {
    console.error("Failed to refine email content:", error);
    return NextResponse.json(
      { error: "Failed to refine content" },
      { status: 500 }
    );
  }
}
