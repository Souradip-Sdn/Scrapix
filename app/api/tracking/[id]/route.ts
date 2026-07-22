import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

// GET – customer polls for partner location + pickup info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pickupId = Number(id);
  if (!pickupId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const auth = await requireApiUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [row] = (await db`
    SELECT p.id, p.status, p.request_no,
           p.address, p.city, p.pincode,
           p.partner_lat, p.partner_lng, p.partner_last_seen,
           u.name   AS customer_name,
           u.latitude  AS customer_lat,
           u.longitude AS customer_lng,
           pp.name  AS partner_name,
           pp.phone AS partner_phone,
           pp.vehicle_type
    FROM pickup_requests p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN pickup_partners pp ON pp.id = p.partner_id
    WHERE p.id = ${pickupId}
      AND p.user_id = ${auth.user.id}
  `) as unknown as {
    id: number;
    status: string;
    request_no: string;
    address: string;
    city: string;
    pincode: string;
    partner_lat: number | null;
    partner_lng: number | null;
    partner_last_seen: string | null;
    customer_name: string;
    customer_lat: number | null;
    customer_lng: number | null;
    partner_name: string | null;
    partner_phone: string | null;
    vehicle_type: string | null;
  }[];

  if (!row) return NextResponse.json({ error: "Pickup not found" }, { status: 404 });

  return NextResponse.json({ pickup: row });
}

// PATCH – partner pushes their current GPS location
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pickupId = Number(id);
  if (!pickupId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Verify partner session
  let partnerId: number | null = null;
  try {
    const store = await cookies();
    const token = store.get("scrapix_partner_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "pickup_partner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    partnerId = Number(payload.id);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lat, lng } = await request.json() as { lat: number; lng: number };
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  await db`
    UPDATE pickup_requests
    SET partner_lat       = ${lat},
        partner_lng       = ${lng},
        partner_id        = ${partnerId},
        partner_last_seen = NOW()
    WHERE id = ${pickupId}
      AND status IN ('pending', 'scheduled', 'collected')
  `;

  return NextResponse.json({ ok: true });
}
