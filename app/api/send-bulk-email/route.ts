import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscribers } from "@/supabase/CRUD/queries";
import { createCampaign } from "@/supabase/CRUD/queries";
import { createRecipients } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { success: false, error: "Subject and body are required" },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      subject,
      body,
      status: "sending",
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Failed to create campaign record" },
        { status: 500 }
      );
    }

    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active subscribers found" },
        { status: 400 }
      );
    }

    const emails = subscribers.map((s) => s.email);
    const recipientCount = await createRecipients(campaign.id, emails);

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipientCount,
      message: `Campaign queued. ${recipientCount} recipients added. Use /api/process-email-batch to process.`,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
