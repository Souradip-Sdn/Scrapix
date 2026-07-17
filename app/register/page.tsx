import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/forms/register-form";
export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container auth-shell">
      <div className="glass card" style={{ width: "min(620px,100%)" }}>
        <span className="eyebrow">Create account</span>
        <h2>Start your circular journey.</h2>
        <p className="muted">
          Register to request collections, track value and measure verified
          impact.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
