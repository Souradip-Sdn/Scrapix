import { Suspense } from "react";
import { PartnerLoginForm } from "@/components/forms/partner-login-form";

export const metadata = {
  title: "Pickup Partner Login | Scrapix",
  description: "Sign in to your Scrapix pickup partner portal",
};

export default function PartnerLoginPage() {
  return (
    <div className="container auth-shell">
      <div className="glass card auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: "1.6rem" }}>🚛</span>
          <span className="eyebrow">Pickup Partner Portal</span>
        </div>
        <h2>Agent sign in.</h2>
        <p className="muted">
          Access your pickup partner dashboard. New partners must verify their account via OTP on first login.
        </p>
        <Suspense fallback={<p>Loading...</p>}>
          <PartnerLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
