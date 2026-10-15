import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { storeOtp, sendOtpEmail } from "@/lib/otp";

export async function GET() {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const partners = await db`
    SELECT
      pp.id, pp.name, pp.email, pp.phone, pp.service_area, pp.vehicle_type,
      pp.landmark, pp.city, pp.state, pp.pincode, pp.latitude, pp.longitude,
      pp.is_verified, pp.status, pp.created_at,
      u.name AS registered_by_name
    FROM pickup_partners pp
    LEFT JOIN users u ON u.id = pp.registered_by
    ORDER BY pp.created_at DESC
  `;

  return NextResponse.json({ partners });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { name, email, phone, service_area, vehicle_type, otp_via,
            landmark, city, state, pincode, latitude, longitude,
            password } = body;

    if (!name || !email || !phone || !service_area || !vehicle_type || !city || !state || !pincode) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }
    if (!password || String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check uniqueness
    const [existingEmail] = await db`SELECT id FROM pickup_partners WHERE email = ${email}`;
    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const [existingPhone] = await db`SELECT id FROM pickup_partners WHERE phone = ${phone}`;
    if (existingPhone) return NextResponse.json({ error: "Phone already registered" }, { status: 409 });

    // Hash the admin-provided password
    const passwordHash = bcrypt.hashSync(String(password), 10);

    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;

    const [partner] = await db`
      INSERT INTO pickup_partners
        (name, email, phone, service_area, landmark, city, state, pincode,
         latitude, longitude, vehicle_type, password_hash, registered_by)
      VALUES
        (${name}, ${email}, ${phone}, ${service_area}, ${landmark ?? ''}, ${city}, ${state}, ${pincode},
         ${lat}, ${lng}, ${vehicle_type}, ${passwordHash}, ${auth.user.id})
      RETURNING id, name, email, phone
    `;

    // Send OTP via Email
    const emailOtp = await storeOtp(email, "email", "partner_verify");
    await sendOtpEmail(email, emailOtp, name);

    return NextResponse.json({
      partner: { ...partner, tempPassword: String(password) },
      message: "Partner registered. OTP sent for verification.",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 },
    );
  }
}
