"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";

const STATUS_META: Record<
  string,
  { label: string; nextLabel: string; icon: React.ReactNode; btnClass: string }
> = {
  pending: {
    label: "Pending",
    nextLabel: "Mark as Scheduled",
    icon: <CalendarCheck size={15} />,
    btnClass: "btn btn-secondary",
  },
  scheduled: {
    label: "Scheduled",
    nextLabel: "Mark as Collected",
    icon: <PackageCheck size={15} />,
    btnClass: "btn btn-primary",
  },
};

interface Props {
  pickupId: number;
  initialStatus: string;
}

export function PickupStatusAdvancer({ pickupId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const meta = STATUS_META[status];

  async function handleAdvance() {
    if (!meta) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/pickup/${pickupId}/status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status.");
      } else {
        setStatus(data.newStatus);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {error && (
        <div
          className="error-box"
          style={{ fontSize: "0.85rem", padding: "10px 14px" }}
        >
          {error}
        </div>
      )}

      {/* Current status badge */}
      <div
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="muted">Current Status</span>
        <span
          className={`badge badge-${status}`}
          style={{ textTransform: "capitalize" }}
        >
          {status}
        </span>
      </div>

      {/* Advance button — only for pending/scheduled */}
      {meta && (
        <button
          className={`${meta.btnClass}`}
          style={{ gap: 9, width: "100%", justifyContent: "center" }}
          onClick={handleAdvance}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={15} className="spin" />
          ) : (
            meta.icon
          )}
          {loading ? "Updating…" : meta.nextLabel}
        </button>
      )}

      {/* Once collected — show Generate Bill CTA */}
      {status === "collected" && (
        <Link
          href={`/partner-portal/generate-bill/${pickupId}`}
          className="btn btn-primary"
          style={{ gap: 9, width: "100%", justifyContent: "center" }}
        >
          <FileText size={15} /> Generate E-Bill
        </Link>
      )}

      {/* Completed — link to view bill */}
      {status === "completed" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            color: "var(--primary)",
            fontSize: "0.9rem",
          }}
        >
          <CheckCircle2 size={16} />
          <span>Pickup completed &amp; bill issued.</span>
        </div>
      )}
    </div>
  );
}
