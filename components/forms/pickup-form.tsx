"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, LoaderCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type Material = { id: number; name: string; rate_per_kg: number };
export function PickupForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [materialId, setMaterialId] = useState(materials[0]?.id || 0);
  const [weight, setWeight] = useState(10);
  const selected = materials.find((m) => m.id === materialId);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
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
    e.currentTarget.reset();
    setWeight(10);
    router.refresh();
  }
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  return (
    <form onSubmit={submit} className="glass card stack">
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
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
        <div className="field full">
          <label>Pickup address</label>
          <textarea
            name="address"
            required
            minLength={10}
            placeholder="Building, street and landmark"
          />
        </div>
        <div className="field">
          <label>City</label>
          <input name="city" required />
        </div>
        <div className="field">
          <label>Pincode</label>
          <input name="pincode" inputMode="numeric" pattern="\d{6}" required />
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
