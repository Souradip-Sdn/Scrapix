"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { Loader2 } from "lucide-react";

interface PartnerTrackingMapProps {
  pickupId: number;
  customerLat: number;
  customerLng: number;
  customerName: string;
  address: string;
  city: string;
}

const UPDATE_INTERVAL_MS = 10000;

export function PartnerTrackingMap({
  pickupId,
  customerLat,
  customerLng,
  customerName,
  address,
  city,
}: PartnerTrackingMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const partnerMarkerRef = useRef<Marker | null>(null);
  const mapContainerId = `partner-map-${pickupId}`;
  
  const [partnerCoords, setPartnerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 1. Geolocation tracker & DB updater
  useEffect(() => {
    let watchId: number;
    let updateInterval: ReturnType<typeof setInterval>;

    async function sendLocation(lat: number, lng: number) {
      try {
        await fetch(`/api/tracking/${pickupId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to send location update:", err);
      }
    }

    if ("geolocation" in navigator) {
      // Watch position for map update
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPartnerCoords({ lat: latitude, lng: longitude });
          setGpsError("");
        },
        (error) => {
          console.error("GPS watch error:", error);
          setGpsError("Could not access high-accuracy GPS.");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );

      // Periodically update the database (throttled to UPDATE_INTERVAL_MS)
      updateInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            sendLocation(position.coords.latitude, position.coords.longitude);
          },
          null,
          { enableHighAccuracy: true },
        );
      }, UPDATE_INTERVAL_MS);

      // Trigger one immediate send
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(position.coords.latitude, position.coords.longitude);
        },
        null,
        { enableHighAccuracy: true },
      );
    } else {
      setGpsError("Geolocation is not supported by this browser.");
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [pickupId]);

  // 2. Map Initializer
  useEffect(() => {
    let L: typeof import("leaflet");
    let mounted = true;

    async function initMap() {
      L = await import("leaflet");
      // Fix marker icon loading paths
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

      const map = L.map(container).setView([customerLat, customerLng], 14);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Customer marker (blue)
      const customerIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#00c47a,#0095d0);
          border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);
          display:grid;place-items:center;font-size:18px;">📦</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<strong>Customer: ${customerName}</strong><br>${address}, ${city}`)
        .openPopup();
    }

    initMap();

    return () => {
      mounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [customerLat, customerLng, customerName, address, city, mapContainerId]);

  // 3. Move partner pin in response to state updates
  useEffect(() => {
    if (!mapRef.current || !partnerCoords) return;

    import("leaflet").then((L) => {
      const partnerIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:linear-gradient(135deg,#f59e0b,#ef4444);
          border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.5);
          display:grid;place-items:center;font-size:20px;">🚛</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (!partnerMarkerRef.current) {
        partnerMarkerRef.current = L.marker([partnerCoords.lat, partnerCoords.lng], { icon: partnerIcon })
          .addTo(mapRef.current!)
          .bindPopup("<strong>Your Location (Live)</strong>");
      } else {
        partnerMarkerRef.current.setLatLng([partnerCoords.lat, partnerCoords.lng]);
      }

      // Auto fit map bounds to show both
      mapRef.current!.fitBounds(
        [
          [customerLat, customerLng],
          [partnerCoords.lat, partnerCoords.lng],
        ],
        { padding: [50, 50] },
      );
    });
  }, [partnerCoords, customerLat, customerLng]);

  return (
    <div className="stack" style={{ gap: 16 }}>
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
        <span>📦 Destination (Customer)</span>
        <span>🚛 You (Live GPS)</span>
        {lastUpdated ? (
          <span className="muted" style={{ marginLeft: "auto" }}>
            Sharing location... Last broadcast: <strong>{lastUpdated.toLocaleTimeString()}</strong>
          </span>
        ) : (
          <span className="muted" style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <Loader2 size={13} className="spin" /> Initializing broadcast...
          </span>
        )}
      </div>

      {gpsError && (
        <div className="error-box" style={{ fontSize: "0.85rem", padding: "10px 14px" }}>
          ⚠️ {gpsError} Make sure location permission is enabled.
        </div>
      )}

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
    </div>
  );
}
