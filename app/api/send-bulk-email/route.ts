import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getActiveSubscribers } from "@/supabase/CRUD/querries";

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

    // Get all active subscribers
    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active subscribers found" },
        { status: 400 }
      );
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const sendPromises = batch.map((subscriber) => {
        return transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: subscriber.email,
          subject: subject,
          html: body,
        });
      });

      try {
        await Promise.all(sendPromises);
        sentCount += batch.length;
      } catch (error) {
        console.error("Error sending batch:", error);
      }
    }

    return NextResponse.json({
      success: true,
      count: sentCount,
      message: `Email sent to ${sentCount} subscribers`,
    });
  } catch (error) {
    console.error("Error sending bulk email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
