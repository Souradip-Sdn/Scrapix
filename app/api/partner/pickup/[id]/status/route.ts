import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import db from "@/lib/db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

const STATUS_TRANSITIONS: Record<string, string> = {
  pending: "scheduled",
  scheduled: "collected",
};

// PATCH /api/partner/pickup/[id]/status — advance pickup status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pickupId = Number(id);
  if (isNaN(pickupId)) {
    return NextResponse.json({ error: "Invalid pickup ID" }, { status: 400 });
  }

  // Verify partner session
  let partnerId: number | null = null;
  let partnerCity: string | null = null;
  try {
    const store = await cookies();
    const token = store.get("scrapix_partner_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "pickup_partner")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    partnerId = Number(payload.id);

    const [partner] = (await db`
      SELECT city FROM pickup_partners WHERE id = ${partnerId} AND is_verified = true
    `) as unknown as { city: string }[];
    if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    partnerCity = partner.city;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch pickup — must be in partner's service city
  const [pickup] = (await db`
    SELECT id, status, user_id FROM pickup_requests
    WHERE id = ${pickupId}
      AND LOWER(city) = LOWER(${partnerCity!})
  `) as unknown as { id: number; status: string; user_id: number }[];

  if (!pickup) {
    return NextResponse.json({ error: "Pickup not found in your service area." }, { status: 404 });
  }

  const nextStatus = STATUS_TRANSITIONS[pickup.status];
  if (!nextStatus) {
    return NextResponse.json(
      { error: `Cannot advance status from '${pickup.status}'.` },
      { status: 400 },
    );
  }

  await db`
    UPDATE pickup_requests
    SET status = ${nextStatus},
        partner_id = ${partnerId}
    WHERE id = ${pickupId}
  `;

  // Notify customer on collection
  if (nextStatus === "collected") {
    await db`
      INSERT INTO notifications (user_id, title, message)
      VALUES (${pickup.user_id}, 'Scrap Collected', 'Your scrap has been collected by the pickup partner. A payment e-bill will be issued shortly.')
    `;
  } else if (nextStatus === "scheduled") {
    await db`
      INSERT INTO notifications (user_id, title, message)
      VALUES (${pickup.user_id}, 'Pickup Scheduled', 'Your pickup request has been accepted by a partner and is now scheduled.')
    `;
  }

  return NextResponse.json({ success: true, newStatus: nextStatus });
}
