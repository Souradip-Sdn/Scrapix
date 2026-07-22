import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

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

// GET /api/partner/profile — return current partner's profile
export async function GET() {
  const partnerId = await getPartnerId();
  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [partner] = (await db`
    SELECT id, name, email, phone, service_area, vehicle_type,
           landmark, city, state, pincode, latitude, longitude,
           is_verified, status, created_at
    FROM pickup_partners
    WHERE id = ${partnerId}
  `) as unknown as {
    id: number;
    name: string;
    email: string;
    phone: string;
    service_area: string;
    vehicle_type: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    is_verified: boolean;
    status: string;
    created_at: string;
  }[];

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  return NextResponse.json({ partner });
}

// PATCH /api/partner/profile — update current partner's editable fields
export async function PATCH(request: Request) {
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

  const { name, phone, service_area, vehicle_type, landmark, city, state, pincode, latitude, longitude,
          changePassword, currentPassword, newPassword } = body as {
    name?: string;
    phone?: string;
    service_area?: string;
    vehicle_type?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: string;
    longitude?: string;
    changePassword?: boolean;
    currentPassword?: string;
    newPassword?: string;
  };

  // ── Change password branch ─────────────────────────────────────────────────
  if (changePassword) {
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    const [row] = (await db`
      SELECT password_hash FROM pickup_partners WHERE id = ${partnerId}
    `) as unknown as { password_hash: string }[];

    if (!row) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    const match = await bcrypt.compare(currentPassword, row.password_hash);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db`UPDATE pickup_partners SET password_hash = ${newHash} WHERE id = ${partnerId}`;
    return NextResponse.json({ success: true });
  }

  // Validation
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!phone?.trim() || !/^\d{10}$/.test(phone.trim())) return NextResponse.json({ error: "Valid 10-digit phone number is required." }, { status: 400 });
  if (!service_area?.trim()) return NextResponse.json({ error: "Service area is required." }, { status: 400 });
  if (!vehicle_type?.trim()) return NextResponse.json({ error: "Vehicle type is required." }, { status: 400 });
  if (!city?.trim()) return NextResponse.json({ error: "City is required." }, { status: 400 });
  if (!state?.trim()) return NextResponse.json({ error: "State is required." }, { status: 400 });
  if (!pincode?.trim() || !/^\d{6}$/.test(pincode.trim())) return NextResponse.json({ error: "Valid 6-digit PIN code is required." }, { status: 400 });

  // Check phone uniqueness (exclude self)
  const [existing] = (await db`
    SELECT id FROM pickup_partners WHERE phone = ${phone.trim()} AND id != ${partnerId}
  `) as unknown as { id: number }[];
  if (existing) {
    return NextResponse.json({ error: "This phone number is already registered with another account." }, { status: 409 });
  }

  const lat = latitude && latitude.trim() !== "" ? parseFloat(latitude) : null;
  const lng = longitude && longitude.trim() !== "" ? parseFloat(longitude) : null;

  await db`
    UPDATE pickup_partners SET
      name         = ${name.trim()},
      phone        = ${phone.trim()},
      service_area = ${service_area.trim()},
      vehicle_type = ${vehicle_type.trim()},
      landmark     = ${(landmark ?? "").trim()},
      city         = ${city.trim()},
      state        = ${state.trim()},
      pincode      = ${pincode.trim()},
      latitude     = ${lat},
      longitude    = ${lng}
    WHERE id = ${partnerId}
  `;

  return NextResponse.json({ success: true });
}
