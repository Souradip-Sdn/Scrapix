"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

interface TrackingData {
  status: string;
  request_no: string;
  address: string;
  city: string;
  customer_lat: number | null;
  customer_lng: number | null;
  partner_lat: number | null;
  partner_lng: number | null;
  partner_last_seen: string | null;
  partner_name: string | null;
  partner_phone: string | null;
  vehicle_type: string | null;
}

interface PickupTrackingMapProps {
  pickupId: number;
  initialData: TrackingData;
}

const POLL_INTERVAL_MS = 5000;

// Leaflet must be imported client-side only
export function PickupTrackingMap({ pickupId, initialData }: PickupTrackingMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const customerMarkerRef = useRef<Marker | null>(null);
  const partnerMarkerRef = useRef<Marker | null>(null);
  const lastSeenRef = useRef<HTMLSpanElement | null>(null);
  const statusRef = useRef<HTMLSpanElement | null>(null);
  const mapContainerId = `tracking-map-${pickupId}`;

  useEffect(() => {
    let L: typeof import("leaflet");
    let intervalId: ReturnType<typeof setInterval>;
    let mounted = true;

    async function init() {
      L = await import("leaflet");
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mounted) return;

      const container = document.getElementById(mapContainerId);
      if (!container) return;

      // Init map centred on customer location or India default
      const centerLat = initialData.customer_lat ?? 23.8315;
      const centerLng = initialData.customer_lng ?? 91.2868;

      const map = L.map(container, { zoomControl: true }).setView([centerLat, centerLng], 14);
      mapRef.current = map;

      // Tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Customer pickup pin (blue)
      const blueIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#00c47a,#0095d0);
          border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);
          display:grid;place-items:center;font-size:18px;">📦</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      if (initialData.customer_lat && initialData.customer_lng) {
        customerMarkerRef.current = L.marker(
          [initialData.customer_lat, initialData.customer_lng],
          { icon: blueIcon },
        )
          .addTo(map)
          .bindPopup(`<strong>Pickup address</strong><br>${initialData.address}, ${initialData.city}`)
          .openPopup();
      }

      // Partner truck pin (green, initially hidden if no coords)
      const truckIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:linear-gradient(135deg,#f59e0b,#ef4444);
          border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.5);
          display:grid;place-items:center;font-size:20px;">🚛</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (initialData.partner_lat && initialData.partner_lng) {
        partnerMarkerRef.current = L.marker(
          [initialData.partner_lat, initialData.partner_lng],
          { icon: truckIcon },
        )
          .addTo(map)
          .bindPopup(
            `<strong>${initialData.partner_name ?? "Your Partner"}</strong><br>
             ${initialData.vehicle_type ? "🚛 " + initialData.vehicle_type.replace("_", " ") : ""}`,
          );

        // Fit both markers
        if (initialData.customer_lat && initialData.customer_lng) {
          map.fitBounds([
            [initialData.customer_lat, initialData.customer_lng],
            [initialData.partner_lat, initialData.partner_lng],
          ], { padding: [50, 50] });
        }
      }

      // Start polling
      intervalId = setInterval(async () => {
        if (!mounted) return;
        try {
          const res = await fetch(`/api/tracking/${pickupId}`);
          if (!res.ok) return;
          const { pickup } = await res.json() as { pickup: TrackingData };

          // Update partner marker
          if (pickup.partner_lat && pickup.partner_lng) {
            if (!partnerMarkerRef.current) {
              partnerMarkerRef.current = L.marker(
                [pickup.partner_lat, pickup.partner_lng],
                { icon: truckIcon },
              ).addTo(map)
                .bindPopup(`<strong>${pickup.partner_name ?? "Your Partner"}</strong>`);
            } else {
              partnerMarkerRef.current.setLatLng([pickup.partner_lat, pickup.partner_lng]);
            }
          }

          // Update last-seen text
          if (lastSeenRef.current && pickup.partner_last_seen) {
            const secs = Math.round((Date.now() - new Date(pickup.partner_last_seen).getTime()) / 1000);
            lastSeenRef.current.textContent = secs < 10 ? "just now" : `${secs}s ago`;
          }

          // Update status badge
          if (statusRef.current) {
            statusRef.current.textContent = pickup.status;
          }
        } catch { /* silent */ }
      }, POLL_INTERVAL_MS);
    }

    init();
    return () => {
      mounted = false;
      clearInterval(intervalId);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupId]);

  const hasPartnerLoc = !!(initialData.partner_lat && initialData.partner_lng);

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Legend / info bar */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.85rem",
        }}
      >
        <span>📦 Pickup address</span>
        <span>🚛 Partner location</span>
        <span className="muted">
          Status:{" "}
          <span
            ref={statusRef}
            style={{
              textTransform: "capitalize",
              color: "var(--primary)",
              fontWeight: 600,
            }}
          >
            {initialData.status}
          </span>
        </span>
        {hasPartnerLoc && (
          <span className="muted">
            Last updated:{" "}
            <span ref={lastSeenRef} style={{ color: "var(--secondary)" }}>
              {initialData.partner_last_seen
                ? `${Math.round((Date.now() - new Date(initialData.partner_last_seen).getTime()) / 1000)}s ago`
                : "–"}
            </span>
          </span>
        )}
        {initialData.partner_name && (
          <span className="muted">
            Partner: <strong>{initialData.partner_name}</strong>
            {initialData.partner_phone && ` · ${initialData.partner_phone}`}
          </span>
        )}
      </div>

      {/* Live map */}
      <div
        id={mapContainerId}
        style={{
          width: "100%",
          height: 480,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 0,
        }}
      />

      {!hasPartnerLoc && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(245,158,11,0.09)",
            border: "1px solid rgba(245,158,11,0.3)",
            fontSize: "0.85rem",
            color: "var(--text)",
          }}
        >
          ⏳ Waiting for your pickup partner to start sharing their location…
        </div>
      )}
    </div>
  );
}
