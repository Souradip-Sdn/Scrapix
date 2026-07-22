"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, Mail, MailCheck, MapPin,
  MessageSquare, Navigation, Pencil, Phone,
  Truck, User, X,
} from "lucide-react";

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

const vehicleLabel: Record<string, string> = {
  two_wheeler: "Two Wheeler",
  three_wheeler: "Auto / Three Wheeler",
  pickup_truck: "Pickup Truck",
  mini_truck: "Mini Truck",
  large_truck: "Large Truck",
};

const statusColor: Record<string, string> = {
  active: "badge-approved",
  inactive: "badge-pending",
  suspended: "badge-cancelled",
};

interface Props {
  partner: PickupPartner;
  onClose: () => void;
  onEdit: () => void;
}

export function ViewPickupPartnerModal({ partner, onClose, onEdit }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  const hasCoords = partner.latitude != null && partner.longitude != null;
  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${partner.latitude},${partner.longitude}&z=15&output=embed&iwloc=near`
    : null;

  const addressLine = [
    partner.landmark,
    partner.service_area,
    partner.city,
    partner.state,
    partner.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-partner-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          width: "min(600px, 100%)",
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
          className="icon-btn"
          aria-label="Close dialog"
          style={{ position: "absolute", top: 18, right: 18, zIndex: 2 }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <span className="eyebrow">Partner Details</span>
        <h3
          id="view-partner-dialog-title"
          style={{ marginTop: 6, marginBottom: 14, paddingRight: 45 }}
        >
          {partner.name}
        </h3>

        {/* Status badges */}
        <div className="row" style={{ gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          <span
            className={`badge ${statusColor[partner.status] ?? "badge-pending"}`}
            style={{ textTransform: "capitalize" }}
          >
            {partner.status}
          </span>
          {partner.is_verified ? (
            <span className="badge badge-approved" style={{ gap: 5 }}>
              <MailCheck size={12} /> Verified
            </span>
          ) : (
            <span className="badge badge-pending" style={{ gap: 5 }}>
              <MessageSquare size={12} /> Awaiting verification
            </span>
          )}
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px 24px",
            marginBottom: 22,
          }}
        >
          <DetailRow icon={<Mail size={14} />}        label="Email"          value={partner.email} />
          <DetailRow icon={<Phone size={14} />}       label="Phone"          value={partner.phone} />
          <DetailRow icon={<Truck size={14} />}       label="Vehicle"        value={vehicleLabel[partner.vehicle_type] ?? partner.vehicle_type} />
          <DetailRow icon={<User size={14} />}        label="Registered By"  value={partner.registered_by_name || "—"} />
          <DetailRow
            icon={<CalendarDays size={14} />}
            label="Registered On"
            value={new Date(partner.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          />
          {hasCoords && (
            <DetailRow
              icon={<Navigation size={14} />}
              label="Coordinates"
              value={`${Number(partner.latitude).toFixed(5)}, ${Number(partner.longitude).toFixed(5)}`}
            />
          )}
        </div>

        {/* Address */}
        {addressLine && (
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              Address
            </p>
            <div
              className="row"
              style={{ gap: 8, alignItems: "flex-start", color: "var(--text)", fontSize: "0.9rem" }}
            >
              <MapPin
                size={14}
                style={{ color: "var(--secondary)", flexShrink: 0, marginTop: 3 }}
              />
              {addressLine}
            </div>
          </div>
        )}

        {/* Map embed */}
        {mapSrc ? (
          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--outline)",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid var(--outline)",
                fontSize: "0.76rem",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MapPin size={12} /> Google Maps — exact location
              <a
                href={`https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: "auto", color: "var(--secondary)", fontSize: "0.74rem" }}
              >
                Open in Google Maps ↗
              </a>
            </div>
            <iframe
              src={mapSrc}
              title={`Location of ${partner.name}`}
              style={{ width: "100%", height: 260, border: 0, display: "block" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div
            style={{
              height: 72,
              borderRadius: 14,
              marginBottom: 22,
              border: "1px dashed var(--outline)",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
              fontSize: "0.84rem",
            }}
          >
            No map coordinates — edit the partner to add a location.
          </div>
        )}

        {/* Actions */}
        <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
          <button
            id="view-to-edit-btn"
            className="btn btn-secondary btn-sm"
            onClick={onEdit}
            style={{ gap: 6 }}
          >
            <Pencil size={14} /> Edit Partner
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: "0.75rem",
          fontWeight: 800,
          letterSpacing: "0.05em",
          color: "var(--muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div className="row" style={{ gap: 7, color: "var(--text)", fontSize: "0.9rem" }}>
        <span style={{ color: "var(--secondary)", flexShrink: 0 }}>{icon}</span>
        {value}
      </div>
    </div>
  );
}
