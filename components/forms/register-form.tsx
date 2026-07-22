"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, UserPlus, MapPin, Eye, EyeOff } from "lucide-react";
import { LocationFields } from "@/components/admin/location-fields";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"individual" | "organization">("individual");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [location, setLocation] = useState({
    service_area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!location.latitude || !location.longitude) {
      setError("Please pin your location on the map.");
      return;
    }

    setLoading(true);
    const data = new FormData(event.currentTarget);
    const password = data.get("password") as string;
    const confirmPassword = data.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const payload = Object.fromEntries(data);

    // Add coordinates from state
    payload.address = location.landmark
      ? `${location.service_area}, ${location.landmark}`
      : location.service_area;
    payload.city = location.city;
    payload.state = location.state;
    payload.pincode = location.pincode;
    payload.latitude = location.latitude;
    payload.longitude = location.longitude;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

      <div className="section-head" style={{ marginTop: 8, marginBottom: 16 }}>
        <div>
          <h4 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Account Details
          </h4>
          <p className="muted" style={{ fontSize: "0.85rem", margin: "4px 0 0" }}>
            Basic information for your Scrapix profile.
          </p>
        </div>
      </div>

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
        <div className="field">
          <label htmlFor="password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "var(--muted)", cursor: "pointer", padding: 0,
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "var(--muted)", cursor: "pointer", padding: 0,
              }}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
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

      <div className="section-head" style={{ marginTop: 24, marginBottom: 16 }}>
        <div>
          <h4 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <MapPin size={18} /> Pickup Location
          </h4>
          <p className="muted" style={{ fontSize: "0.85rem", margin: "4px 0 0" }}>
            This will be your default address for e-waste collections.
          </p>
        </div>
      </div>

      <LocationFields
        idPrefix="register"
        value={location}
        onChange={setLocation}
      />

      <button className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
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
