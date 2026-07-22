"use client";

import { useState } from "react";
import { Save, X, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { LocationPickerMapProps } from "@/components/admin/location-picker-map";

const LocationPickerMap = dynamic<LocationPickerMapProps>(
  () =>
    import("@/components/admin/location-picker-map").then(
      (mod) => mod.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 340,
          display: "grid",
          placeItems: "center",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.16)",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        Loading map…
      </div>
    ),
  },
);

const VEHICLE_OPTIONS = [
  { value: "two_wheeler", label: "Two Wheeler" },
  { value: "three_wheeler", label: "Auto / Three Wheeler" },
  { value: "pickup_truck", label: "Pickup Truck" },
  { value: "mini_truck", label: "Mini Truck" },
  { value: "large_truck", label: "Large Truck" },
];

interface PartnerData {
  name: string;
  email: string;
  phone: string;
  service_area: string;
  vehicle_type: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
}

interface Props {
  partner: PartnerData;
}

export function ProfileEditForm({ partner }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState(partner.name);
  const [phone, setPhone] = useState(partner.phone);
  const [serviceArea, setServiceArea] = useState(partner.service_area);
  const [vehicleType, setVehicleType] = useState(partner.vehicle_type);
  const [landmark, setLandmark] = useState(partner.landmark ?? "");
  const [city, setCity] = useState(partner.city ?? "");
  const [state, setState] = useState(partner.state ?? "");
  const [pincode, setPincode] = useState(partner.pincode ?? "");
  const [lat, setLat] = useState(partner.latitude != null ? String(partner.latitude) : "");
  const [lng, setLng] = useState(partner.longitude != null ? String(partner.longitude) : "");

  function cancelEdit() {
    setEditing(false);
    setError("");
    setSuccess("");
    // Reset to original
    setName(partner.name);
    setPhone(partner.phone);
    setServiceArea(partner.service_area);
    setVehicleType(partner.vehicle_type);
    setLandmark(partner.landmark ?? "");
    setCity(partner.city ?? "");
    setState(partner.state ?? "");
    setPincode(partner.pincode ?? "");
    setLat(partner.latitude != null ? String(partner.latitude) : "");
    setLng(partner.longitude != null ? String(partner.longitude) : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          service_area: serviceArea,
          vehicle_type: vehicleType,
          landmark,
          city,
          state,
          pincode,
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save profile.");
      } else {
        setSuccess("Profile updated successfully!");
        setEditing(false);
        // Refresh the page so server data is up to date
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasCoords =
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng));

  if (!editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {success && <div className="success-box">{success}</div>}
        <button
          id="edit-profile-btn"
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: "flex-start" }}
          onClick={() => { setSuccess(""); setEditing(true); }}
        >
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <form
      id="partner-profile-edit-form"
      onSubmit={handleSubmit}
      className="stack"
      style={{ gap: 20, marginTop: 4 }}
    >
      {error && <div className="error-box">{error}</div>}

      {/* Basic Info */}
      <div>
        <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Basic Information</span>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="profile-name">Full Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-phone">Phone Number <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              inputMode="numeric"
              pattern="\d{10}"
              minLength={10}
              maxLength={10}
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-email">Email Address</label>
            <input
              id="profile-email"
              value={partner.email}
              readOnly
              aria-readonly="true"
              tabIndex={-1}
              style={{ cursor: "not-allowed", opacity: 0.6, background: "rgba(0,0,0,0.18)" }}
            />
            <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>Email cannot be changed</span>
          </div>

          <div className="field">
            <label htmlFor="profile-vehicle">Vehicle Type <span style={{ color: "var(--danger)" }}>*</span></label>
            <select
              id="profile-vehicle"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
            >
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Service Location</span>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="profile-service-area">Service Area / Full Address <span style={{ color: "var(--danger)" }}>*</span></label>
            <textarea
              id="profile-service-area"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              required
              minLength={3}
              rows={3}
              placeholder="House number, road, locality, village or ward"
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </div>

          <div className="field full">
            <label htmlFor="profile-landmark">Landmark</label>
            <input
              id="profile-landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Near market, school, hospital, etc."
            />
          </div>

          <div className="field">
            <label htmlFor="profile-city">City / Town <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              id="profile-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Agartala"
              autoComplete="address-level2"
            />
          </div>

          <div className="field">
            <label htmlFor="profile-state">State <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              id="profile-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              placeholder="Tripura"
              autoComplete="address-level1"
            />
          </div>

          <div className="field full">
            <label htmlFor="profile-pincode">PIN Code <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              id="profile-pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
              placeholder="799001"
              autoComplete="postal-code"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="field">
        <label>Pin Exact Location</label>
        <div style={{ marginTop: 8 }}>
          <LocationPickerMap
            latitude={lat}
            longitude={lng}
            onPositionChange={(latitude, longitude) => {
              setLat(latitude.toFixed(7));
              setLng(longitude.toFixed(7));
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: hasCoords
            ? "1px solid rgba(34,197,94,0.35)"
            : "1px solid rgba(245,158,11,0.35)",
          background: hasCoords
            ? "rgba(34,197,94,0.09)"
            : "rgba(245,158,11,0.09)",
          fontSize: "0.8rem",
        }}
      >
        {hasCoords
          ? `📍 Location pinned: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
          : "Move or click the map to pin your exact service location."}
      </div>

      {/* Actions */}
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <button
          type="submit"
          id="save-profile-btn"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          id="cancel-edit-btn"
          className="btn btn-ghost"
          onClick={cancelEdit}
          disabled={saving}
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </form>
  );
}
