import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

// GET /api/pickups/[id]/ebill — fetch e-bill for a pickup owned by the logged-in customer
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const pickupId = Number(id);
  if (isNaN(pickupId)) {
    return NextResponse.json({ error: "Invalid pickup ID" }, { status: 400 });
  }

  // Ensure the pickup belongs to the logged-in user
  const [pickup] = (await db`
    SELECT id, user_id FROM pickup_requests WHERE id = ${pickupId}
  `) as unknown as { id: number; user_id: number }[];

  if (!pickup) {
    return NextResponse.json({ error: "Pickup not found" }, { status: 404 });
  }
  if (pickup.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [bill] = (await db`
    SELECT
      e.id, e.bill_no, e.actual_weight_kg, e.rate_per_kg,
      e.gross_amount, e.platform_fee, e.net_payable, e.notes, e.created_at,
      m.name AS material_name, m.category AS material_category,
      u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
      u.address AS customer_address, u.city AS customer_city, u.state AS customer_state,
      u.bank_account_number, u.bank_ifsc_code, u.bank_name,
      pp.name AS partner_name, pp.phone AS partner_phone,
      pr.request_no, pr.preferred_date
    FROM ebills e
    JOIN materials m ON m.id = e.material_id
    JOIN users u ON u.id = e.customer_id
    JOIN pickup_partners pp ON pp.id = e.partner_id
    JOIN pickup_requests pr ON pr.id = e.pickup_id
    WHERE e.pickup_id = ${pickupId}
  `) as unknown as {
    id: number;
    bill_no: string;
    actual_weight_kg: number;
    rate_per_kg: number;
    gross_amount: number;
    platform_fee: number;
    net_payable: number;
    notes: string;
    created_at: string;
    material_name: string;
    material_category: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_state: string;
    bank_account_number: string;
    bank_ifsc_code: string;
    bank_name: string;
    partner_name: string;
    partner_phone: string;
    request_no: string;
    preferred_date: string;
  }[];

  if (!bill) {
    return NextResponse.json({ error: "No e-bill found for this pickup" }, { status: 404 });
  }

  return NextResponse.json({ bill });
}
