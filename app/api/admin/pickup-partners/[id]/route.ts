import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { storeOtp, sendOtpEmail, canResendOtp } from "@/lib/otp";

// ─── GET single partner ────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const [partner] = (await db`
    SELECT
      pp.id, pp.name, pp.email, pp.phone, pp.service_area, pp.vehicle_type,
      pp.landmark, pp.city, pp.state, pp.pincode, pp.latitude, pp.longitude,
      pp.is_verified, pp.status, pp.created_at,
      u.name AS registered_by_name
    FROM pickup_partners pp
    LEFT JOIN users u ON u.id = pp.registered_by
    WHERE pp.id = ${Number(id)}
  `) as unknown as {
    id: number; name: string; email: string; phone: string;
    service_area: string; vehicle_type: string;
    landmark: string; city: string; state: string; pincode: string;
    latitude: number | null; longitude: number | null;
    is_verified: boolean; status: string; created_at: string; registered_by_name: string;
  }[];

  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json({ partner });
}

// ─── PATCH update fields / status / resend OTP ────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const partnerId = Number(id);

  const [partner] = (await db`
    SELECT id, name, email, phone, status FROM pickup_partners WHERE id = ${partnerId}
  `) as unknown as { id: number; name: string; email: string; phone: string; status: string }[];

  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await request.json();

  // Full profile update
  if (body.updateProfile) {
    const { name, email, phone, service_area, vehicle_type,
            landmark, city, state, pincode, latitude, longitude } = body;
    if (!name || !email || !phone || !service_area || !vehicle_type || !city || !state || !pincode) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    // Check uniqueness (allow own email/phone)
    const [emailConflict] = await db`
      SELECT id FROM pickup_partners WHERE email = ${email} AND id != ${partnerId}
    `;
    if (emailConflict) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const [phoneConflict] = await db`
      SELECT id FROM pickup_partners WHERE phone = ${phone} AND id != ${partnerId}
    `;
    if (phoneConflict) return NextResponse.json({ error: "Phone already in use" }, { status: 409 });

    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;

    await db`
      UPDATE pickup_partners
      SET name = ${name}, email = ${email}, phone = ${phone},
          service_area = ${service_area}, vehicle_type = ${vehicle_type},
          landmark = ${landmark ?? ''}, city = ${city}, state = ${state},
          pincode = ${pincode}, latitude = ${lat}, longitude = ${lng}
      WHERE id = ${partnerId}
    `;
    return NextResponse.json({ message: "Partner updated successfully" });
  }

  // Status-only update
  if (body.status) {
    await db`UPDATE pickup_partners SET status = ${body.status} WHERE id = ${partnerId}`;
    return NextResponse.json({ message: "Status updated" });
  }

  // Resend OTP via email
  if (body.resendOtp) {
    const canEmail = await canResendOtp(partner.email, "partner_verify");
    if (!canEmail) {
      return NextResponse.json({ error: "Please wait 60 seconds before resending" }, { status: 429 });
    }

    const code = await storeOtp(partner.email, "email", "partner_verify");
    await sendOtpEmail(partner.email, code, partner.name);
    return NextResponse.json({ message: "OTP resent to email successfully" });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}

// ─── DELETE partner ────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const partnerId = Number(id);

  const [partner] = await db`SELECT id FROM pickup_partners WHERE id = ${partnerId}`;
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  // Clean up OTP codes first, then delete partner
  await db`DELETE FROM otp_codes WHERE target IN (
    SELECT email FROM pickup_partners WHERE id = ${partnerId}
    UNION
    SELECT phone FROM pickup_partners WHERE id = ${partnerId}
  )`;
  await db`DELETE FROM pickup_partners WHERE id = ${partnerId}`;

  return NextResponse.json({ message: "Partner deleted successfully" });
}
