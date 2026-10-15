import { NextResponse } from "next/server";
import db from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

async function getPartnerCity(): Promise<{ id: number; city: string } | null> {
  try {
    const store = await cookies();
    const token = store.get("scrapix_partner_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "pickup_partner") return null;
    const partnerId = Number(payload.id);
    const [partner] = (await db`
      SELECT id, city FROM pickup_partners WHERE id = ${partnerId} AND is_verified = true
    `) as unknown as { id: number; city: string }[];
    return partner ?? null;
  } catch {
    return null;
  }
}

// GET /api/partner/pickup/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const partner = await getPartnerCity();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pickupId = Number(id);
  if (isNaN(pickupId)) {
    return NextResponse.json({ error: "Invalid pickup ID" }, { status: 400 });
  }

  const [pickup] = (await db`
    SELECT
      p.id, p.request_no, p.weight_kg AS original_weight_kg, p.estimated_value AS original_value,
      p.address, p.city, p.pincode, p.preferred_date, p.status, p.material_id,
      u.name AS customer_name, u.phone AS customer_phone,
      m.name AS original_material
    FROM pickup_requests p
    JOIN users u ON u.id = p.user_id
    JOIN materials m ON m.id = p.material_id
    WHERE p.id = ${pickupId}
      AND LOWER(p.city) = LOWER(${partner.city})
  `) as unknown as {
    id: number;
    request_no: string;
    original_weight_kg: number;
    original_value: number;
    address: string;
    city: string;
    pincode: string;
    preferred_date: string;
    status: string;
    material_id: number;
    customer_name: string;
    customer_phone: string;
    original_material: string;
  }[];

  if (!pickup) {
    return NextResponse.json({ error: "Pickup not found in your service area." }, { status: 404 });
  }

  return NextResponse.json({ pickup });
}
