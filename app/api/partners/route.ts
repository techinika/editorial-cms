import { NextRequest, NextResponse } from "next/server";
import {
  checkAuthStatusServer,
  isAdminOnly,
  isAuthorizedEditor,
} from "@/lib/auth-server";
import {
  createPartner,
  getPartnerPickerOptions,
  listPartners,
} from "@/supabase/modules/partners";
import { validatePartnerInput } from "@/lib/partner-validation";

/**
 * Partners.
 *
 * GET is admin-only in full, because a partner record carries a contact email
 * and internal notes. The exception is `?picker=1`, which any authenticated
 * editor may call: the article and idea forms need to name a partner, and an
 * author tagging their own piece has no business seeing a partner's contact
 * details. That mode projects only the four columns a dropdown needs.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    if (searchParams.get("picker") === "1") {
      if (!isAuthorizedEditor(auth)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ partners: await getPartnerPickerOptions() });
    }

    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const partners = await listPartners({
      includeInactive: searchParams.get("active") !== "1",
      search: searchParams.get("search") || undefined,
    });
    return NextResponse.json({ partners });
  } catch (error) {
    console.error("GET /api/partners error:", error);
    return NextResponse.json({ error: "Failed to load partners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { valid, errors, value } = validatePartnerInput(body);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }

    const partner = await createPartner(value);
    if (!partner) {
      return NextResponse.json(
        { error: "Failed to save the partner" },
        { status: 500 }
      );
    }
    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    console.error("POST /api/partners error:", error);
    return NextResponse.json(
      { error: "Failed to save the partner" },
      { status: 500 }
    );
  }
}
