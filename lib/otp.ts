import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import db from "@/lib/db";

// ─── Generate ─────────────────────────────────────────────────────────────────
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── Store ────────────────────────────────────────────────────────────────────
export async function storeOtp(
  target: string,
  targetType: "email" | "phone",
  purpose: string,
): Promise<string> {
  const code = generateOtp();
  const hash = bcrypt.hashSync(code, 8);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous unused OTPs for the same target + purpose
  await db`
    UPDATE otp_codes
    SET used_at = CURRENT_TIMESTAMP
    WHERE target = ${target}
      AND purpose = ${purpose}
      AND used_at IS NULL
  `;

  await db`
    INSERT INTO otp_codes (target, target_type, purpose, code_hash, expires_at)
    VALUES (${target}, ${targetType}, ${purpose}, ${hash}, ${expiresAt})
  `;

  return code;
}

// ─── Verify ───────────────────────────────────────────────────────────────────
export async function verifyOtp(
  target: string,
  code: string,
  purpose: string,
): Promise<{ success: boolean; error?: string }> {
  const rows = (await db`
    SELECT id, code_hash, expires_at, used_at
    FROM otp_codes
    WHERE target = ${target}
      AND purpose = ${purpose}
      AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `) as unknown as {
    id: number;
    code_hash: string;
    expires_at: string;
    used_at: string | null;
  }[];

  if (!rows.length) return { success: false, error: "No active OTP found" };

  const row = rows[0];

  if (new Date(row.expires_at) < new Date()) {
    return { success: false, error: "OTP has expired" };
  }

  const valid = bcrypt.compareSync(code, row.code_hash);
  if (!valid) return { success: false, error: "Invalid OTP" };

  await db`UPDATE otp_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ${row.id}`;
  return { success: true };
}

// ─── Check last OTP send time (rate-limit: 1 per 60s) ────────────────────────
export async function canResendOtp(
  target: string,
  purpose: string,
): Promise<boolean> {
  const [row] = (await db`
    SELECT created_at FROM otp_codes
    WHERE target = ${target} AND purpose = ${purpose}
    ORDER BY created_at DESC
    LIMIT 1
  `) as unknown as { created_at: string }[];

  if (!row) return true;
  const elapsed = Date.now() - new Date(row.created_at).getTime();
  return elapsed > 60 * 1000;
}

// ─── Send via Email (Nodemailer / Gmail SMTP) ─────────────────────────────────
export async function sendOtpEmail(to: string, otp: string, name: string) {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.log(
      `[OTP EMAIL - DEV] To: ${to} | Code: ${otp} | (Set SMTP_EMAIL + SMTP_PASSWORD in .env for real delivery)`,
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Scrapix Platform" <${user}>`,
    to,
    subject: "Your Scrapix Pickup Partner OTP",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0d1513;font-family:'Segoe UI',Arial,sans-serif;color:#dce4e0;">
        <div style="max-width:480px;margin:40px auto;padding:32px;background:rgba(35,44,41,0.95);border-radius:20px;border:1px solid rgba(255,255,255,0.09);">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="font-size:2rem;">♻️</span>
            <h1 style="margin:12px 0 4px;font-size:1.6rem;color:#cdffde;letter-spacing:-0.03em;">Scrapix</h1>
            <p style="margin:0;color:#a8bab0;font-size:0.82rem;text-transform:uppercase;letter-spacing:0.14em;font-weight:800;">Pickup Partner Verification</p>
          </div>
          <p style="margin:0 0 8px;color:#a8bab0;font-size:0.9rem;">Hello, <strong style="color:#dce4e0;">${name}</strong></p>
          <p style="margin:0 0 24px;color:#a8bab0;font-size:0.9rem;">Your one-time verification code is:</p>
          <div style="text-align:center;margin:28px 0;">
            <span style="display:inline-block;font-size:2.8rem;font-weight:900;letter-spacing:0.25em;color:#50ffaf;background:rgba(80,255,175,0.08);border:1px solid rgba(80,255,175,0.25);border-radius:16px;padding:18px 32px;">${otp}</span>
          </div>
          <p style="margin:0 0 8px;color:#a8bab0;font-size:0.84rem;text-align:center;">This code expires in <strong style="color:#ffd166;">10 minutes</strong>.</p>
          <p style="margin:24px 0 0;color:#3b4a40;font-size:0.78rem;text-align:center;">If you didn't expect this email, please ignore it.</p>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Send via SMS (Fast2SMS) ───────────────────────────────────────────────────
export async function sendOtpSms(phone: string, otp: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(
      `[OTP SMS - DEV] To: ${phone} | Code: ${otp} | (Set FAST2SMS_API_KEY in .env for real delivery)`,
    );
    return;
  }

  const url = new URL("https://www.fast2sms.com/dev/bulkV2");
  url.searchParams.set("authorization", apiKey);
  url.searchParams.set("variables_values", otp);
  url.searchParams.set("route", "otp");
  url.searchParams.set("numbers", phone);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    console.error("[Fast2SMS] SMS send failed:", text);
  }
}
