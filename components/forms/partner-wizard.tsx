"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

const types = [
  {
    value: "retailer",
    title: "Retailer",
    desc: "Direct-to-consumer sale of sustainable and energy-efficient appliances.",
    icon: Store,
  },
  {
    value: "installer",
    title: "Installer Network",
    desc: "Deployment and maintenance of solar, HVAC and smart-home infrastructure.",
    icon: Wrench,
  },
  {
    value: "distributor",
    title: "Distributor / Manufacturer",
    desc: "Supply-chain management and large-scale manufacturing of eco-certified materials.",
    icon: Building2,
  },
  {
    value: "collector",
    title: "Collection Partner",
    desc: "Doorstep collection, sorting and transport of reusable materials.",
    icon: Truck,
  },
  {
    value: "recycler",
    title: "Certified Recycler",
    desc: "Authorized material recovery and responsible recycling operations.",
    icon: CheckCircle2,
  },
] as const;

type PartnerType = (typeof types)[number]["value"];
type Profile = {
  businessName: string;
  gstNumber: string;
  monthlyCapacityKg: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  serviceRadiusKm: string;
};

const initialProfile: Profile = {
  businessName: "",
  gstNumber: "",
  monthlyCapacityKg: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  serviceRadiusKm: "",
};

export function PartnerWizard({ existingStatus }: { existingStatus?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PartnerType>("installer");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, businessType: type }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Unable to submit application");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done)
    return (
      <div className="glass card empty">
        <CheckCircle2
          size={48}
          style={{ color: "var(--primary)", marginBottom: 14 }}
        />
        <h2>Application submitted</h2>
        <p>
          Scrapix compliance will review your business profile. Track the status
          from your dashboard.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="glass card stack">
      {existingStatus && (
        <div
          className={
            existingStatus === "rejected" ? "error-box" : "success-box"
          }
        >
          Current application status: {existingStatus}
        </div>
      )}
      {error && <div className="error-box">{error}</div>}
      <div className="stepper">
        <div className="step active" data-step="1">
          Business type
        </div>
        <div className={`step ${step >= 2 ? "active" : ""}`} data-step="2">
          Company profile
        </div>
        <div className={`step ${step >= 3 ? "active" : ""}`} data-step="3">
          Verification
        </div>
      </div>

      {step === 1 && (
        <>
          <div>
            <span className="eyebrow">Step 1</span>
            <h2>Define your footprint.</h2>
            <p className="muted">
              Select how your organization participates in the green ecosystem.
            </p>
          </div>
          <div className="grid grid-2">
            {types.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setType(item.value)}
                  className={`card soft option-card ${type === item.value ? "selected" : ""}`}
                  style={{ textAlign: "left", color: "inherit" }}
                >
                  <Icon size={23} style={{ color: "var(--secondary)" }} />
                  <h3>{item.title}</h3>
                  <p
                    className="muted"
                    style={{ fontSize: ".85rem", margin: 0 }}
                  >
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <span className="eyebrow">Step 2</span>
            <h2>Business profile.</h2>
          </div>
          <div className="form-grid">
            <div className="field full">
              <label>Business name</label>
              <input
                value={profile.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="field">
              <label>GST number (optional)</label>
              <input
                value={profile.gstNumber}
                onChange={(e) => update("gstNumber", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Monthly capacity (kg)</label>
              <input
                value={profile.monthlyCapacityKg}
                onChange={(e) => update("monthlyCapacityKg", e.target.value)}
                type="number"
                min="1"
                required
              />
            </div>
            <div className="field full">
              <label>Registered address</label>
              <textarea
                value={profile.address}
                onChange={(e) => update("address", e.target.value)}
                required
                minLength={10}
              />
            </div>
            <div className="field">
              <label>City</label>
              <input
                value={profile.city}
                onChange={(e) => update("city", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>State</label>
              <input
                value={profile.state}
                onChange={(e) => update("state", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input
                value={profile.pincode}
                onChange={(e) => update("pincode", e.target.value)}
                pattern="\d{6}"
                required
              />
            </div>
            <div className="field">
              <label>Service radius (km)</label>
              <input
                value={profile.serviceRadiusKm}
                onChange={(e) => update("serviceRadiusKm", e.target.value)}
                type="number"
                min="1"
                required
              />
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="card soft">
          <span className="eyebrow">Step 3</span>
          <h2>Verification consent.</h2>
          <p className="muted">
            By submitting, you confirm the company information is accurate and
            authorize Scrapix to verify business, GST, environmental permits and
            operational capacity.
          </p>
          <div className="row">
            <input
              id="consent"
              type="checkbox"
              required
              style={{ width: 18 }}
            />
            <label htmlFor="consent">
              I confirm and authorize verification.
            </label>
          </div>
        </div>
      )}

      <div className="row between">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous
        </button>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : null}
          {step === 3 ? "Submit application" : "Continue"}
        </button>
      </div>
    </form>
  );
}
