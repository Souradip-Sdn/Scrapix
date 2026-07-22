import { Suspense } from "react";
import { OtpVerifyForm } from "@/components/forms/otp-verify-form";

export const metadata = {
  title: "Verify Your Account | Scrapix Partner",
  description: "Enter the OTP sent to your email or phone to verify your Scrapix pickup partner account",
};

export default function PartnerVerifyPage() {
  return (
    <div className="container auth-shell">
      <div className="glass card" style={{ width: "min(520px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: "2.4rem", display: "block", marginBottom: 10 }}>🔐</span>
          <span className="eyebrow">Identity Verification</span>
          <h2 style={{ margin: "8px 0 6px" }}>Verify your account.</h2>
          <p className="muted" style={{ maxWidth: 360, margin: "0 auto" }}>
            Enter the 6-digit OTP sent to your registered email and phone number.
          </p>
        </div>
        <Suspense fallback={<p style={{ textAlign: "center" }}>Loading...</p>}>
          <OtpVerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
