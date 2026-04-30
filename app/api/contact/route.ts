import { NextResponse } from "next/server";
import { createQuery } from "@/supabase/CRUD/querries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, message, subject, name } = body;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const query = await createQuery({
      email,
      message,
      subject,
      name,
    });

    if (!query) {
      return NextResponse.json(
        { error: "Failed to save your message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Thank you for contacting us!" }
    );
  } catch (error) {
    console.error("Error in contact form submission:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
