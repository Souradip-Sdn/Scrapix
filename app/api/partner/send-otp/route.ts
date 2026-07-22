import { NextResponse } from "next/server";
import db from "@/lib/db";
import { storeOtp, sendOtpEmail, sendOtpSms, canResendOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { partnerId, via } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
    }

    const [partner] = (await db`
      SELECT id, name, email, phone FROM pickup_partners WHERE id = ${Number(partnerId)}
    `) as unknown as { id: number; name: string; email: string; phone: string }[];

    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const channel: string = via || "both";

    // Rate-limit check
    if (channel === "email" || channel === "both") {
      const ok = await canResendOtp(partner.email, "partner_verify");
      if (!ok) return NextResponse.json({ error: "Please wait 60 seconds before resending" }, { status: 429 });
    }
    if (channel === "sms" || channel === "both") {
      const ok = await canResendOtp(partner.phone, "partner_verify");
      if (!ok) return NextResponse.json({ error: "Please wait 60 seconds before resending" }, { status: 429 });
    }

    const sends: Promise<void>[] = [];
    if (channel === "email" || channel === "both") {
      const code = await storeOtp(partner.email, "email", "partner_verify");
      sends.push(sendOtpEmail(partner.email, code, partner.name));
    }
    if (channel === "sms" || channel === "both") {
      const code = await storeOtp(partner.phone, "phone", "partner_verify");
      sends.push(sendOtpSms(partner.phone, code));
    }
    await Promise.allSettled(sends);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send OTP" },
      { status: 500 },
    );
  }
}
