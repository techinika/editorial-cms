import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getPendingRecipients,
  markRecipientSent,
  markRecipientFailed,
  getRecipientCounts,
} from "@/supabase/CRUD/queries";
import { updateCampaignStats } from "@/supabase/CRUD/queries";
import { checkAuthStatusServer } from "@/lib/auth-server";

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
    const authResult = await checkAuthStatusServer();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { campaignId, batchSize = 50, subject, body } = await request.json();

    if (!campaignId || !subject || !body) {
      return NextResponse.json(
        { success: false, error: "campaignId, subject, and body are required" },
        { status: 400 }
      );
    }

    const pending = await getPendingRecipients(campaignId, batchSize);

    if (pending.length === 0) {
      const counts = await getRecipientCounts(campaignId);
      const totalProcessed = counts.sent + counts.failed;
      if (totalProcessed > 0) {
        await updateCampaignStats(
          campaignId,
          counts.sent,
          counts.failed,
          totalProcessed
        );
      }
      return NextResponse.json({
        success: true,
        processed: 0,
        done: true,
        counts,
      });
    }

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      pending.map(async (recipient) => {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient.email,
            subject,
            html: body,
          });
          await markRecipientSent(recipient.id);
          return { success: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          await markRecipientFailed(recipient.id, msg);
          return { success: false, error: msg };
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.success) sent++;
      else failed++;
    }

    const counts = await getRecipientCounts(campaignId);

    return NextResponse.json({
      success: true,
      processed: pending.length,
      sent,
      failed,
      done: counts.pending === 0,
      counts,
    });
  } catch (error) {
    console.error("Error processing email batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process batch" },
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
