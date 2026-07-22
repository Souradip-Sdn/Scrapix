import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const [partner] = (await db`
      SELECT id, name, email, phone, password_hash, is_verified, status
      FROM pickup_partners
      WHERE email = ${email}
    `) as unknown as {
      id: number;
      name: string;
      email: string;
      phone: string;
      password_hash: string;
      is_verified: boolean;
      status: string;
    }[];

    if (!partner || !bcrypt.compareSync(password, partner.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (partner.status === "suspended") {
      return NextResponse.json({ error: "Your account has been suspended. Contact admin." }, { status: 403 });
    }

    if (!partner.is_verified) {
      if (process.env.NODE_ENV === "development") {
        // [DEV MODE BYPASS] Auto-verify so the developer doesn't need OTPs
        await db`UPDATE pickup_partners SET is_verified = true WHERE id = ${partner.id}`;
        partner.is_verified = true;
      } else {
        return NextResponse.json({
          needsVerification: true,
          partnerId: partner.id,
          partnerEmail: partner.email,
          partnerPhone: partner.phone,
          partnerName: partner.name,
        });
      }
    }

    // Verified — create a pickup-partner session token
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 },
    );
  }
}
