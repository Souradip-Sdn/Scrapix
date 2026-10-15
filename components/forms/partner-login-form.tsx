"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";

export function PartnerLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/partner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) { setError(result.error || "Login failed"); return; }

    if (result.needsVerification) {
      // Redirect to OTP verification page
      const params = new URLSearchParams({
        id: String(result.partnerId),
        name: result.partnerName,
        email: result.partnerEmail,
        phone: result.partnerPhone,
      });
      router.push(`/partner/verify?${params.toString()}`);
      return;
    }

    router.push("/partner-portal");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="stack">
      {error && <div className="error-box">{error}</div>}
      <div className="field">
        <label htmlFor="partner-email">Email Address</label>
        <input
          id="partner-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
        />
      </div>
      <div className="field">
        <label htmlFor="partner-password">Password</label>
        <div style={{ position: "relative" }}>
          <input
            id="partner-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{ paddingRight: 42 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Show password" : "Hide password"}
            style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "var(--muted)", cursor: "pointer", padding: 0,
            }}
          >
            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
      <button className="btn btn-primary" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={18} /> : <LogIn size={18} />}
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <p className="muted" style={{ textAlign: "center", margin: 0, fontSize: "0.85rem" }}>
        Your credentials are provided by the Scrapix admin.
      </p>
    </form>
  );
}
