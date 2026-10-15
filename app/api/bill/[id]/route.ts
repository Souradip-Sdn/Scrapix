import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

// GET /api/bill/[id] — fetch a bill by its ID.
// Accessible by: the customer it belongs to, the partner who generated it, or any admin.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const billId = Number(id);
  if (isNaN(billId)) {
    return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
  }

  const store = await cookies();

  // --- Try customer session ---
  const customerToken = store.get("scrapix_session")?.value;
  if (customerToken) {
    try {
      const { payload } = await jwtVerify(customerToken, secret);
      const userId = Number(payload.id);
      const role = String(payload.role);

      if (role === "admin") {
        // Admin can see any bill
        const [bill] = await fetchBill(billId);
        if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        return NextResponse.json({ bill });
      }

      if (role === "customer") {
        const [bill] = await fetchBill(billId);
        if (!bill || bill.customer_id !== userId) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ bill });
      }
    } catch {
      // fall through
    }
  }

  // --- Try partner session ---
  const partnerToken = store.get("scrapix_partner_session")?.value;
  if (partnerToken) {
    try {
      const { payload } = await jwtVerify(partnerToken, secret);
      if (payload.role === "pickup_partner") {
        const partnerId = Number(payload.id);
        const [bill] = await fetchBill(billId);
        if (!bill || bill.partner_id !== partnerId) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ bill });
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function fetchBill(billId: number) {
  return db`
    SELECT
      e.id, e.bill_no, e.actual_weight_kg, e.rate_per_kg,
      e.gross_amount, e.platform_fee, e.net_payable, e.notes, e.created_at,
      e.customer_id, e.partner_id,
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
    WHERE e.id = ${billId}
  ` as unknown as BillRow[];
}

export type BillRow = {
  id: number;
  bill_no: string;
  actual_weight_kg: number;
  rate_per_kg: number;
  gross_amount: number;
  platform_fee: number;
  net_payable: number;
  notes: string;
  created_at: string;
  customer_id: number;
  partner_id: number;
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
};
