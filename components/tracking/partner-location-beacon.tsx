"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Radio, StopCircle, Loader2 } from "lucide-react";

interface PartnerLocationBeaconProps {
  pickupId: number;
  requestNo: string;
}

const BROADCAST_INTERVAL_MS = 10_000;

export function PartnerLocationBeacon({ pickupId, requestNo }: PartnerLocationBeaconProps) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "broadcasting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastPingAgo, setLastPingAgo] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPingRef = useRef<Date | null>(null);
  const pingTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function ping() {
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`/api/tracking/${pickupId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            });
            if (!res.ok) throw new Error("Server error");
            lastPingRef.current = new Date();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  }

  async function startBroadcast() {
    setStatus("requesting");
    setErrorMsg("");

    try {
      await ping(); // first ping immediately
      setStatus("broadcasting");
      setActive(true);

      // Update "X sec ago" display every second
      pingTickRef.current = setInterval(() => {
        if (lastPingRef.current) {
          setLastPingAgo(Math.round((Date.now() - lastPingRef.current.getTime()) / 1000));
        }
      }, 1000);

      // Continue pinging
      intervalRef.current = setInterval(async () => {
        try {
          await ping();
        } catch {
          // non-fatal, just continue
        }
      }, BROADCAST_INTERVAL_MS);
    } catch (err) {
      const msg = err instanceof GeolocationPositionError
        ? err.code === 1
          ? "Location access denied. Please allow location in your browser."
          : "Unable to get your location."
        : "Could not start location sharing.";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  function stopBroadcast() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pingTickRef.current) clearInterval(pingTickRef.current);
    intervalRef.current = null;
    pingTickRef.current = null;
    lastPingRef.current = null;
    setActive(false);
    setStatus("idle");
    setLastPingAgo(null);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pingTickRef.current) clearInterval(pingTickRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        border: active
          ? "1px solid rgba(34,197,94,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "rgba(34,197,94,0.06)"
          : "rgba(255,255,255,0.03)",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* Status dot */}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            background: active ? "#22c55e" : "rgba(255,255,255,0.25)",
            boxShadow: active ? "0 0 8px #22c55e" : "none",
            animation: active ? "pulse 2s infinite" : "none",
          }}
        />
        <span style={{ fontSize: "0.82rem", color: "var(--muted)", flex: 1 }}>
          {active
            ? `Broadcasting for ${requestNo}${lastPingAgo !== null ? ` · last ping ${lastPingAgo}s ago` : ""}`
            : `Share live location for ${requestNo}`}
        </span>

        {status === "requesting" ? (
          <button className="btn btn-secondary btn-sm" disabled>
            <Loader2 size={13} className="spin" /> Getting GPS…
          </button>
        ) : active ? (
          <button
            className="btn btn-ghost btn-sm"
            onClick={stopBroadcast}
            style={{ color: "var(--danger)", borderColor: "rgba(255,80,80,0.3)" }}
          >
            <StopCircle size={13} /> Stop
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={startBroadcast}
            style={{ gap: 6 }}
          >
            <Radio size={13} />
            Share Location
          </button>
        )}
      </div>

      {status === "error" && errorMsg && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--danger)" }}>
          ⚠ {errorMsg}
        </p>
      )}
    </div>
  );
}
