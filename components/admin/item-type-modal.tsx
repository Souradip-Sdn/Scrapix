"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Boxes,
  Check,
  CheckCircle2,
  DollarSign,
  Leaf,
  LoaderCircle,
  Plus,
  Save,
  Tag,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

export interface MaterialItem {
  id: number;
  name: string;
  category: string;
  rate_per_kg: number;
  co2_factor: number;
  active: number;
  pickup_count?: number;
}

interface Props {
  mode: "create" | "edit";
  material?: MaterialItem | null;
  existingCategories: string[];
  onClose: () => void;
  onSuccess: (material: MaterialItem) => void;
}

export function ItemTypeModal({
  mode,
  material,
  existingCategories,
  onClose,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [name, setName] = useState(material?.name ?? "");
  const [category, setCategory] = useState(material?.category ?? (existingCategories[0] || "Appliances"));
  const [ratePerKg, setRatePerKg] = useState(material ? String(material.rate_per_kg) : "100");
  const [co2Factor, setCo2Factor] = useState(material ? String(material.co2_factor) : "3.5");
  const [active, setActive] = useState(material ? material.active === 1 : true);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [loading, onClose]);

  // Derived preview numbers
  const numericRate = parseFloat(ratePerKg) || 0;
  const numericCo2 = parseFloat(co2Factor) || 0;
  const sampleWeight = 10;
  const sampleValue = numericRate * sampleWeight;
  const sampleCo2 = numericCo2 * sampleWeight;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const rate = parseFloat(ratePerKg);
    const co2 = parseFloat(co2Factor);

    if (!trimmedName) {
      setError("Item name is required.");
      return;
    }
    if (!trimmedCategory) {
      setError("Category is required.");
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setError("Rate per kg must be greater than 0.");
      return;
    }
    if (isNaN(co2) || co2 < 0) {
      setError("CO₂ factor cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: trimmedName,
        category: trimmedCategory,
        rate_per_kg: rate,
        co2_factor: co2,
        active: active ? 1 : 0,
      };

      const url = mode === "create" ? "/api/admin/materials" : `/api/admin/materials/${material?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to save item type.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.material);
        onClose();
      }, 700);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected network error occurred.");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 999999,
        background: "rgba(8, 16, 14, 0.88)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        overflowY: "auto",
        padding: "24px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="glass card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          position: "relative",
          margin: "auto",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 28px 80px rgba(0, 0, 0, 0.55)",
          padding: "28px 30px",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="icon-btn"
          aria-label="Close dialog"
          style={{ position: "absolute", top: 18, right: 18, zIndex: 2 }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid",
                placeItems: "center",
                color: "#051610",
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <span className="eyebrow" style={{ letterSpacing: "0.08em" }}>
                {mode === "create" ? "Catalog Management" : "Item Editor"}
              </span>
              <h3 id="item-modal-title" style={{ margin: 0, fontSize: "1.35rem" }}>
                {mode === "create" ? "Add New Item Type" : `Edit "${material?.name}"`}
              </h3>
            </div>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
            {mode === "create"
              ? "Define scrap name, category classification, procurement rate per kg, and verified carbon factor."
              : "Update pricing and carbon telemetry factors for this item across all active calculators and handovers."}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-box" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="success-box" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} />
            {mode === "create" ? "Item type created successfully!" : "Item type updated successfully!"}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Item Name */}
          <div className="field">
            <label htmlFor="material-name">Item / Material Name</label>
            <input
              id="material-name"
              type="text"
              required
              placeholder="e.g. Lithium-Ion Batteries, Server Racks, CRT Monitors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Category Input & Quick Chips */}
          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label htmlFor="material-category" style={{ margin: 0 }}>Category Classification</label>
              <span className="muted" style={{ fontSize: "0.76rem" }}>Select or type custom</span>
            </div>
            <input
              id="material-category"
              type="text"
              required
              placeholder="e.g. Appliances, Computers, Mobile, Metals, E-Waste"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            />

            {/* Quick category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {Array.from(new Set([...existingCategories, "Appliances", "Computers", "Mobile", "Metals", "Renewables", "Energy Storage", "E-Waste"]))
                .slice(0, 8)
                .map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    disabled={loading}
                    className="chip"
                    style={{
                      cursor: "pointer",
                      fontSize: "0.74rem",
                      padding: "3px 10px",
                      background: category.toLowerCase() === cat.toLowerCase() ? "rgba(80, 255, 175, 0.2)" : undefined,
                      borderColor: category.toLowerCase() === cat.toLowerCase() ? "var(--primary)" : undefined,
                      color: category.toLowerCase() === cat.toLowerCase() ? "var(--primary)" : undefined,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat}
                  </button>
                ))}
            </div>
          </div>

          {/* Rate & CO2 2-column grid */}
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label htmlFor="material-rate">
                Rate per kg (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    fontWeight: 600,
                  }}
                >
                  ₹
                </span>
                <input
                  id="material-rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: 30 }}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="material-co2">
                CO₂ Factor (kg/kg)
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--tertiary)",
                  }}
                >
                  <Leaf size={15} />
                </span>
                <input
                  id="material-co2"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={co2Factor}
                  onChange={(e) => setCo2Factor(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div
            className="card soft"
            style={{
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => !loading && setActive(!active)}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Active in Public Catalog</div>
              <div className="muted" style={{ fontSize: "0.78rem" }}>
                When enabled, customers can select this item in the estimator & pickup scheduler.
              </div>
            </div>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={loading}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--primary)" }}
            />
          </div>

          {/* Live Calculation Preview */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
              borderRadius: 14,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <span className="eyebrow" style={{ fontSize: "0.7rem" }}>Sample 10 kg pickup</span>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--primary)", marginTop: 2 }}>
                {formatCurrency(sampleValue)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="eyebrow" style={{ fontSize: "0.7rem", color: "var(--tertiary)" }}>Carbon Offset</span>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--tertiary)", marginTop: 2 }}>
                {sampleCo2.toFixed(1)} kg CO₂
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-primary"
              style={{ minWidth: 140 }}
            >
              {loading ? (
                <>
                  <LoaderCircle size={16} className="spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check size={16} />
                  Saved!
                </>
              ) : mode === "create" ? (
                <>
                  <Plus size={16} />
                  Add Item Type
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
