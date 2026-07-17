import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container auth-shell">
      <div className="glass card auth-card">
        <span className="eyebrow">Secure access</span>
        <h2>Welcome back.</h2>
        <p className="muted">
          Sign in to manage pickups, impact and partner operations.
        </p>
        <Suspense fallback={<p>Loading...</p>}>
          <LoginForm />
        </Suspense>
        <div className="demo-box">
          <strong>Demo accounts</strong>
          <br />
          Admin: admin@scrapix.local
          <br />
          Customer: customer@scrapix.local
          <br />
          Partner: partner@scrapix.local
          <br />
          Password: Scrapix@123
        </div>
      </div>
    </div>
  );
}
