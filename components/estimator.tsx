"use client";
import { useMemo, useState } from "react";
import { Calculator, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type Material = {
  id: number;
  name: string;
  rate_per_kg: number;
  co2_factor: number;
};
export function Estimator({ materials }: { materials: Material[] }) {
  const [materialId, setMaterialId] = useState(materials[0]?.id || 0);
  const [weight, setWeight] = useState(45);
  const material = useMemo(
    () => materials.find((m) => m.id === materialId),
    [materials, materialId],
  );
  const value = (material?.rate_per_kg || 0) * weight;
  const co2 = (material?.co2_factor || 0) * weight;
  return (
    <div className="glass card stack">
      <div className="row">
        <div className="feature-icon" style={{ margin: 0 }}>
          <Calculator size={21} />
        </div>
        <div>
          <h3 style={{ margin: 0 }}>Scrap-to-Cash Estimator</h3>
          <span className="muted">Live indicative pricing</span>
        </div>
      </div>
      <div className="field">
        <label>Item type</label>
        <select
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
        <label>Estimated weight (kg)</label>
        <input
          type="number"
          min="1"
          max="100000"
          value={weight}
          onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
        />
      </div>
      <div className="estimator-result">
        <span className="eyebrow">Estimated value</span>
        <strong className="row" style={{ justifyContent: "center" }}>
          <IndianRupee size={28} />
          {formatCurrency(value).replace("₹", "")}
        </strong>
        <small className="muted">
          Potential CO₂ saving: {co2.toFixed(1)} kg
        </small>
      </div>
    </div>
  );
}
