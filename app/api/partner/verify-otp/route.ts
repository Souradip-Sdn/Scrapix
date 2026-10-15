import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export async function POST(request: Request) {
  try {
    const { partnerId, code, via } = await request.json();

    if (!partnerId || !code) {
      return NextResponse.json({ error: "Partner ID and OTP code are required" }, { status: 400 });
    }

    const [partner] = (await db`
      SELECT id, name, email, phone FROM pickup_partners WHERE id = ${Number(partnerId)}
    `) as unknown as { id: number; name: string; email: string; phone: string }[];

    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    // Verify OTP sent to partner's email
    const result = await verifyOtp(partner.email, code, "partner_verify");

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 });
    }

    // Mark partner as verified
    await db`UPDATE pickup_partners SET is_verified = true WHERE id = ${partner.id}`;

    // Create session
    const token = await new SignJWT({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: "pickup_partner",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const store = await cookies();
    store.set("scrapix_partner_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      partner: { id: partner.id, name: partner.name, email: partner.email },
      message: "Verification successful",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}
