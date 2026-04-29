import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getActiveSubscribers } from "@/supabase/CRUD/querries";
import { createCampaign, updateCampaignStats } from "@/supabase/CRUD/querries";

// Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { success: false, error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Create campaign record
    const campaign = await createCampaign({
      subject,
      body,
      status: 'sending',
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Failed to create campaign record" },
        { status: 500 }
      );
    }

    // Get all active subscribers
    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      // Update campaign as failed
      await updateCampaignStats(campaign.id, 0, 0, 0);
      return NextResponse.json(
        { success: false, error: "No active subscribers found" },
        { status: 400 }
      );
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const sendPromises = batch.map(async (subscriber) => {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: subscriber.email,
            subject: subject,
            html: body,
          });
          return { success: true, email: subscriber.email };
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          return { success: false, email: subscriber.email };
        }
      });

      const results = await Promise.all(sendPromises);
      sentCount += results.filter(r => r.success).length;
      failedCount += results.filter(r => !r.success).length;
    }

    // Update campaign with stats
    await updateCampaignStats(
      campaign.id,
      sentCount,
      failedCount,
      subscribers.length
    );

    return NextResponse.json({
      success: true,
      count: sentCount,
      failed: failedCount,
      total: subscribers.length,
      campaignId: campaign.id,
      message: `Email sent to ${sentCount} subscribers (${failedCount} failed)`,
    });
  } catch (error) {
    console.error("Error sending bulk email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
