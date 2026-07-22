"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, Save, X } from "lucide-react";
import {
  LocationFields,
  LocationState,
  partnerToLocation,
} from "@/components/admin/location-fields";

type PickupPartner = {
  id: number;
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
  is_verified: boolean;
  status: string;
  created_at: string;
  registered_by_name: string;
};

interface Props {
  partner: PickupPartner;
  onClose: () => void;
  onSuccess: (updated: PickupPartner) => void;
}

export function EditPickupPartnerModal({ partner, onClose, onSuccess }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<LocationState>(
    partnerToLocation(partner),
  );

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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload = { updateProfile: true, ...data, ...location };

    const res = await fetch(`/api/admin/pickup-partners/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error || "Update failed");
      return;
    }

    setSuccess(true);
    onSuccess({
      ...partner,
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      vehicle_type: data.vehicle_type as string,
      service_area: location.service_area,
      landmark: location.landmark,
      city: location.city,
      state: location.state,
      pincode: location.pincode,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
    });
    setTimeout(onClose, 1000);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-partner-dialog-title"
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
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        className="glass card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          position: "relative",
          margin: "auto",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.55)",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="icon-btn"
          aria-label="Close edit dialog"
          style={{ position: "absolute", top: 18, right: 18, zIndex: 2 }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <span className="eyebrow">Admin Action</span>
        <h3
          id="edit-partner-dialog-title"
          style={{ marginTop: 6, marginBottom: 4, paddingRight: 45 }}
        >
          Edit Partner — {partner.name}
        </h3>
        <p
          className="muted"
          style={{ fontSize: "0.88rem", marginBottom: 24 }}
        >
          Update personal details and exact service location. Verified status is
          preserved.
        </p>

        {success && (
          <div className="success-box" style={{ marginBottom: 18 }}>
            ✅ Partner updated successfully!
          </div>
        )}

        <form onSubmit={submit} className="stack" style={{ gap: 18 }}>
          {error && <div className="error-box">{error}</div>}

          {/* ── Personal info ──────────────────────────────────── */}
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
              Personal Information
            </span>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="edit-pp-name">
                  Full Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-pp-name"
                  name="name"
                  defaultValue={partner.name}
                  required
                  minLength={2}
                  placeholder="Rajesh Kumar"
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label htmlFor="edit-pp-phone">
                  Phone Number <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-pp-phone"
                  name="phone"
                  type="tel"
                  defaultValue={partner.phone}
                  required
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>

              <div className="field full">
                <label htmlFor="edit-pp-email">
                  Email Address <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  id="edit-pp-email"
                  name="email"
                  type="email"
                  defaultValue={partner.email}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field full">
                <label htmlFor="edit-pp-vehicle">Vehicle Type</label>
                <select
                  id="edit-pp-vehicle"
                  name="vehicle_type"
                  defaultValue={partner.vehicle_type}
                >
                  <option value="two_wheeler">Two Wheeler</option>
                  <option value="three_wheeler">Three Wheeler / Auto</option>
                  <option value="pickup_truck">Pickup Truck</option>
                  <option value="mini_truck">Mini Truck</option>
                  <option value="large_truck">Large Truck</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Location ───────────────────────────────────────── */}
          <LocationFields
            idPrefix="pp-edit"
            value={location}
            onChange={setLocation}
          />

          {/* ── Actions ────────────────────────────────────────── */}
          <div
            className="row"
            style={{ justifyContent: "flex-end", gap: 10, marginTop: 4 }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="save-partner-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
