"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"individual" | "organization">("individual");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to register");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="stack">
      {error && <div className="error-box">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Account Type</label>
          <div className="row" style={{ marginTop: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="customerType"
                value="individual"
                checked={customerType === "individual"}
                onChange={() => setCustomerType("individual")}
              />{" "}
              Individual
            </label>
            <label
              style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 16 }}
            >
              <input
                type="radio"
                name="customerType"
                value="organization"
                checked={customerType === "organization"}
                onChange={() => setCustomerType("organization")}
              />{" "}
              Organization
            </label>
          </div>
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" required minLength={2} />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" required minLength={8} />
        </div>
        <div className="field full">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field full">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
          />
        </div>
        {customerType === "organization" && (
          <>
            <div className="field full">
              <label htmlFor="companyName">Organization Name</label>
              <input id="companyName" name="companyName" required={customerType === "organization"} />
            </div>
            <div className="field">
              <label htmlFor="orgType">Organization Type</label>
              <select id="orgType" name="orgType" required={customerType === "organization"}>
                <option value="private">Private</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="gstNumber">GST Number</label>
              <input id="gstNumber" name="gstNumber" required={customerType === "organization"} />
            </div>
          </>
        )}
      </div>
      <button className="btn btn-primary" disabled={loading}>
        {loading ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <UserPlus size={18} />
        )}{" "}
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        Already registered?{" "}
        <Link href="/login" style={{ color: "var(--primary)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
