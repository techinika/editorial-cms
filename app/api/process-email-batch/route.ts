import { NextRequest, NextResponse } from "next/server";
import { getRecipientCounts } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { campaignId } = await request.json().catch(() => ({}));

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "campaignId is required" },
        { status: 400 }
      );
    }

    const counts = await getRecipientCounts(campaignId);

    return NextResponse.json({
      success: true,
      processed: counts.sent + counts.failed,
      sent: counts.sent,
      failed: counts.failed,
      done: counts.pending === 0,
      counts,
    });
  } catch (error) {
    console.error("Error checking campaign progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check progress" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "campaignId is required" },
        { status: 400 }
      );
    }

    const counts = await getRecipientCounts(campaignId);

    return NextResponse.json({
      success: true,
      counts,
      done: counts.pending === 0,
    });
  } catch (error) {
    console.error("Error checking campaign progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check progress" },
      { status: 500 }
    );
  }
}
