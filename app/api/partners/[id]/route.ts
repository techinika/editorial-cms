import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer, isAdminOnly } from "@/lib/auth-server";
import {
  deletePartner,
  getPartnerById,
  updatePartner,
} from "@/supabase/modules/partners";
import { validatePartnerInput } from "@/lib/partner-validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const partner = await getPartnerById(id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    return NextResponse.json({ partner });
  } catch (error) {
    console.error("GET /api/partners/[id] error:", error);
    return NextResponse.json({ error: "Failed to load the partner" }, { status: 500 });
  }
}

/** Update a partner. Admin-only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { valid, errors, value } = validatePartnerInput(body, { partial: true });
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 }
      );
    }
    if (Object.keys(value).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const partner = await updatePartner(id, value);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    return NextResponse.json({ partner });
  } catch (error) {
    console.error("PATCH /api/partners/[id] error:", error);
    return NextResponse.json({ error: "Failed to update the partner" }, { status: 500 });
  }
}

/**
 * Delete a partner. Admin-only.
 *
 * Articles and ideas that referenced it are kept, with partner_id nulled by the
 * ON DELETE SET NULL foreign key. Deactivate instead of deleting when the
 * history of what we published for someone still matters.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAdminOnly(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const ok = await deletePartner(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to delete the partner" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/partners/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete the partner" },
      { status: 500 }
    );
  }
}
