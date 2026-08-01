import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscribers } from "@/supabase/CRUD/queries";
import { createCampaign } from "@/supabase/CRUD/queries";
import { createRecipients } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

const COMMS_WORKER_URL = (
  process.env.NEXT_PUBLIC_COMMS_WORKER_URL || "http://localhost:8789"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { subject, body, campaignId } = await request.json();

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

    const queueRes = await fetch(`${COMMS_WORKER_URL}/api/send-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        subject,
        html: body,
        project: "cms",
        campaignId: campaign.id,
      }),
    });

    if (!queueRes.ok) {
      console.error("Failed to enqueue campaign:", await queueRes.text());
      return NextResponse.json(
        { success: false, error: "Failed to enqueue campaign emails" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipientCount,
      count: recipientCount,
      failed: 0,
      message: `Campaign queued. ${recipientCount} recipients will be sent by the email queue.`,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
