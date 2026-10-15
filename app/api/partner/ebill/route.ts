import { NextResponse } from "next/server";
import db from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

const PLATFORM_FEE_PERCENT = 0; // 0% platform fee — all goes to customer

async function getPartnerId(): Promise<number | null> {
  try {
    const store = await cookies();
    const token = store.get("scrapix_partner_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "pickup_partner") return null;
    return Number(payload.id);
  } catch {
    return null;
  }
}

// POST /api/partner/ebill — generate a bill for a collected pickup
export async function POST(request: Request) {
  const partnerId = await getPartnerId();
  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pickupId, materialId, actualWeightKg, notes } = body as {
    pickupId?: number;
    materialId?: number;
    actualWeightKg?: number;
    notes?: string;
  };

  if (!pickupId || !materialId || !actualWeightKg || actualWeightKg <= 0) {
    return NextResponse.json(
      { error: "pickupId, materialId, and a positive actualWeightKg are required." },
      { status: 400 },
    );
  }

  // Get the pickup — must be in 'collected' status
  const [pickup] = (await db`
    SELECT id, user_id, status, city
    FROM pickup_requests
    WHERE id = ${pickupId}
  `) as unknown as { id: number; user_id: number; status: string; city: string }[];

  if (!pickup) {
    return NextResponse.json({ error: "Pickup not found." }, { status: 404 });
  }
  if (pickup.status !== "collected") {
    return NextResponse.json(
      { error: "Bills can only be generated for pickups with 'collected' status." },
      { status: 400 },
    );
  }

  // Check no bill already exists
  const [existingBill] = (await db`
    SELECT id FROM ebills WHERE pickup_id = ${pickupId}
  `) as unknown as { id: number }[];
  if (existingBill) {
    return NextResponse.json(
      { error: "A bill has already been generated for this pickup." },
      { status: 409 },
    );
  }

  // Fetch material rate
  const [material] = (await db`
    SELECT id, name, rate_per_kg, co2_factor
    FROM materials
    WHERE id = ${materialId} AND active = 1
  `) as unknown as { id: number; name: string; rate_per_kg: number; co2_factor: number }[];

  if (!material) {
    return NextResponse.json({ error: "Material not found or inactive." }, { status: 404 });
  }

  const weight = Number(actualWeightKg);
  const ratePerKg = material.rate_per_kg;
  const grossAmount = Number((weight * ratePerKg).toFixed(2));
  const platformFee = Number((grossAmount * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const netPayable = Number((grossAmount - platformFee).toFixed(2));
  const billNo = `BILL-${Date.now().toString().slice(-9)}`;

  const billId = await db.begin(async (sql) => {
    // Insert e-bill
    const [bill] = await sql`
      INSERT INTO ebills (bill_no, pickup_id, partner_id, customer_id, material_id, actual_weight_kg, rate_per_kg, gross_amount, platform_fee, net_payable, notes)
      VALUES (${billNo}, ${pickupId}, ${partnerId}, ${pickup.user_id}, ${materialId}, ${weight}, ${ratePerKg}, ${grossAmount}, ${platformFee}, ${netPayable}, ${notes ?? ""})
      RETURNING id
    `;

    // Update pickup status to completed
    await sql`
      UPDATE pickup_requests
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ${pickupId}
    `;

    // Insert impact entry
    const co2Saved = Number((weight * material.co2_factor).toFixed(2));
    const treesEquiv = Number((co2Saved / 22).toFixed(2));
    await sql`
      INSERT INTO impact_entries (user_id, pickup_id, recycled_kg, co2_saved_kg, trees_equivalent)
      VALUES (${pickup.user_id}, ${pickupId}, ${weight}, ${co2Saved}, ${treesEquiv})
      ON CONFLICT (pickup_id) DO UPDATE SET
        recycled_kg = EXCLUDED.recycled_kg,
        co2_saved_kg = EXCLUDED.co2_saved_kg,
        trees_equivalent = EXCLUDED.trees_equivalent
    `;

    // Notify customer
    await sql`
      INSERT INTO notifications (user_id, title, message)
      VALUES (${pickup.user_id}, 'E-Bill Generated', ${`Your e-bill ${billNo} for ₹${netPayable.toLocaleString("en-IN")} has been issued. View it in your dashboard.`})
    `;

    return Number(bill.id);
  });

  return NextResponse.json({ success: true, billId, billNo, netPayable }, { status: 201 });
}
