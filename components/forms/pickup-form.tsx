"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, LoaderCircle, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type Material = { id: number; name: string; rate_per_kg: number };
interface PickupFormProps {
  materials: Material[];
  userAddress: string;
  userCity: string;
  userPincode: string;
}

export function PickupForm({ materials, userAddress, userCity, userPincode }: PickupFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [materialId, setMaterialId] = useState(materials[0]?.id || 0);
  const [weight, setWeight] = useState(10);
  const selected = materials.find((m) => m.id === materialId);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setSuccess("");
    setLoading(true);
    const fd = new FormData(form);
    const payload = { ...Object.fromEntries(fd), materialId, weightKg: weight };
    const res = await fetch("/api/pickups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to submit request");
      return;
    }
    setSuccess(
      `${data.requestNo} created. Estimated value ${formatCurrency(data.estimatedValue)}.`,
    );
    form.reset();
    setWeight(10);
    router.refresh();
  }
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  return (
    <form onSubmit={submit} className="glass card stack">
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.85rem",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <MapPin size={18} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>Pickup Location:</span>{" "}
          <span className="muted">
            {userAddress ? `${userAddress}, ${userCity} – ${userPincode}` : "No address set in profile"}
          </span>
          <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
            This pickup will be collected from your registered profile address. If this is not the required pickup location, please update it from{" "}
            <Link href="/dashboard/profile" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              Edit Profile
            </Link>
            .
          </p>
        </div>
      </div>

      <input type="hidden" name="address" value={userAddress} />
      <input type="hidden" name="city" value={userCity} />
      <input type="hidden" name="pincode" value={userPincode} />

      <div className="form-grid">
        <div className="field">
          <label>Material</label>
          <select
            name="materialId"
            value={materialId}
            onChange={(e) => setMaterialId(Number(e.target.value))}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Approx. weight (kg)</label>
          <input
            name="weightKg"
            type="number"
            min="1"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            required
          />
        </div>
        <div className="field">
          <label>Preferred date</label>
          <input
            name="preferredDate"
            type="date"
            min={minDate.toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="field">
          <label>Estimated return</label>
          <input
            value={formatCurrency((selected?.rate_per_kg || 0) * weight)}
            readOnly
          />
        </div>
        <div className="field full">
          <label>Notes (optional)</label>
          <textarea
            name="notes"
            placeholder="Access instructions, item condition, preferred time..."
          />
        </div>
      </div>
      <button className="btn btn-primary" disabled={loading}>
        {loading ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <CalendarCheck size={18} />
        )}{" "}
        {loading ? "Submitting..." : "Schedule pickup"}
      </button>
    </form>
  );
}
