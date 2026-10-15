"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Package,
  Scale,
  User,
} from "lucide-react";
import Link from "next/link";

interface Material {
  id: number;
  name: string;
  category: string;
  rate_per_kg: number;
}

interface PickupDetail {
  id: number;
  request_no: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  pincode: string;
  original_material: string;
  original_weight_kg: number;
  original_value: number;
  status: string;
}

interface Props {
  pickupId: number;
  partnerId: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

export function GenerateBillForm({ pickupId, partnerId }: Props) {
  const router = useRouter();
  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedBillId, setGeneratedBillId] = useState<number | null>(null);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const weight = parseFloat(weightKg) || 0;
  const ratePerKg = selectedMaterial?.rate_per_kg ?? 0;
  const grossAmount = weight * ratePerKg;
  const platformFee = 0;
  const netPayable = grossAmount - platformFee;

  useEffect(() => {
    async function fetchData() {
      try {
        const [pickupRes, matsRes] = await Promise.all([
          fetch(`/api/partner/pickup/${pickupId}`),
          fetch("/api/materials"),
        ]);
        if (pickupRes.ok) {
          const d = await pickupRes.json();
          setPickup(d.pickup);
          // Pre-select the material from the original pickup
          if (d.pickup?.material_id) setMaterialId(d.pickup.material_id);
        }
        if (matsRes.ok) {
          const d = await matsRes.json();
          setMaterials(d.materials ?? []);
        }
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [pickupId]);

  // Pre-select material when pickup loads
  useEffect(() => {
    if (pickup && materials.length > 0) {
      const found = materials.find(
        (m) => m.name.toLowerCase() === pickup.original_material?.toLowerCase()
      );
      if (found && materialId === 0) setMaterialId(found.id);
    }
  }, [pickup, materials]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!materialId || !weight || weight <= 0) {
      setError("Please select a material and enter a valid weight.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/partner/ebill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupId, materialId, actualWeightKg: weight, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate bill.");
      } else {
        setSuccess(true);
        setGeneratedBillId(data.billId);
        setTimeout(() => {
          router.push(`/bill/${data.billId}`);
        }, 1200);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <Loader2 size={32} className="spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="glass card" style={{ textAlign: "center", padding: 40 }}>
        <p className="muted">Pickup not found or you do not have access.</p>
        <Link href="/partner-portal" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Customer Info */}
      <div className="glass card stack" style={{ gap: 16 }}>
        <span className="eyebrow">Pickup Details</span>
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 12 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid", placeItems: "center", color: "#002817", flexShrink: 0,
              }}
            >
              <User size={20} />
            </div>
            <div>
              <strong>{pickup.customer_name}</strong>
              <p className="muted" style={{ margin: 0, fontSize: "0.83rem" }}>{pickup.customer_phone}</p>
            </div>
          </div>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: "0.83rem" }}>{pickup.address}</p>
            <p className="muted" style={{ margin: 0, fontSize: "0.83rem" }}>{pickup.city} – {pickup.pincode}</p>
          </div>
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <span className="badge badge-pending" style={{ gap: 6 }}>
            <Package size={12} /> {pickup.original_material}
          </span>
          <span className="badge" style={{ background: "rgba(255,255,255,0.05)" }}>
            Est. {pickup.original_weight_kg} kg
          </span>
          <span className="badge badge-approved" style={{ gap: 6 }}>
            <CheckCircle2 size={12} /> {pickup.request_no}
          </span>
        </div>
      </div>

      {/* Bill Form */}
      <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
        {error && <div className="error-box">{error}</div>}
        {success && (
          <div className="success-box" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <CheckCircle2 size={18} /> Bill generated! Redirecting to e-bill…
          </div>
        )}

        <div className="grid grid-2" style={{ gap: 20 }}>
          {/* Material Select */}
          <div className="glass card stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 8, color: "var(--secondary)" }}>
              <Package size={16} />
              <span className="eyebrow" style={{ color: "var(--secondary)" }}>Item Sold</span>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="gb-material">Select Material</label>
              <select
                id="gb-material"
                value={materialId}
                onChange={(e) => setMaterialId(Number(e.target.value))}
                required
              >
                <option value={0} disabled>— Choose material —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category}) — ₹{m.rate_per_kg}/kg
                  </option>
                ))}
              </select>
            </div>
            {selectedMaterial && (
              <div
                style={{
                  background: "rgba(80,255,175,0.07)",
                  border: "1px solid rgba(80,255,175,0.18)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: "0.88rem",
                }}
              >
                <span className="muted">Rate: </span>
                <strong style={{ color: "var(--primary)" }}>
                  {formatCurrency(selectedMaterial.rate_per_kg)} / kg
                </strong>
              </div>
            )}
          </div>

          {/* Weight Input */}
          <div className="glass card stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 8, color: "var(--primary)" }}>
              <Scale size={16} />
              <span className="eyebrow" style={{ color: "var(--primary)" }}>Actual Weight</span>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="gb-weight">Weight (kg)</label>
              <input
                id="gb-weight"
                type="number"
                step="0.1"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 12.5"
                required
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="gb-notes">Notes (optional)</label>
              <input
                id="gb-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Minor damage, mixed scrap"
              />
            </div>
          </div>
        </div>

        {/* Live Amount Preview */}
        {weight > 0 && selectedMaterial && (
          <div
            className="glass card"
            style={{
              background: "linear-gradient(135deg, rgba(80,255,175,0.08), rgba(150,237,255,0.06))",
              border: "1px solid rgba(80,255,175,0.2)",
            }}
          >
            <div className="row" style={{ gap: 8, marginBottom: 18, color: "var(--secondary)" }}>
              <Calculator size={18} />
              <span className="eyebrow" style={{ color: "var(--secondary)" }}>Amount Preview</span>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                <span className="muted">
                  {weight} kg × {formatCurrency(ratePerKg)}/kg
                </span>
                <span>{formatCurrency(grossAmount)}</span>
              </div>
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                <span className="muted">Platform fee</span>
                <span className="muted">₹0.00</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "4px 0" }} />
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "1rem" }}>Net Payable to Customer</strong>
                <strong style={{ fontSize: "1.5rem", color: "var(--primary)" }}>
                  {formatCurrency(netPayable)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || success || !materialId || !weight}
          style={{ gap: 10 }}
        >
          {loading ? (
            <><Loader2 size={16} className="spin" /> Generating…</>
          ) : success ? (
            <><CheckCircle2 size={16} /> Bill Generated!</>
          ) : (
            <><IndianRupee size={16} /> Generate E-Bill</>
          )}
        </button>
      </form>
    </div>
  );
}
