import { NextResponse } from "next/server";
import db from "@/lib/db";
import { storeOtp, sendOtpEmail, canResendOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { partnerId } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
    }

    const [partner] = (await db`
      SELECT id, name, email, phone FROM pickup_partners WHERE id = ${Number(partnerId)}
    `) as unknown as { id: number; name: string; email: string; phone: string }[];

    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    // Rate-limit check on email
    const ok = await canResendOtp(partner.email, "partner_verify");
    if (!ok) return NextResponse.json({ error: "Please wait 60 seconds before resending" }, { status: 429 });

    const code = await storeOtp(partner.email, "email", "partner_verify");
    await sendOtpEmail(partner.email, code, partner.name);

    return NextResponse.json({ message: "OTP sent to email successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send OTP" },
      { status: 500 },
    );
  }
}
