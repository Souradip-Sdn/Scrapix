"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, FileText, Loader2, PackageCheck } from "lucide-react";
import Link from "next/link";

const NEXT: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending: { label: "Accept & Schedule", icon: <CalendarCheck size={13} />, cls: "btn btn-secondary btn-sm" },
  scheduled: { label: "Mark Collected", icon: <PackageCheck size={13} />, cls: "btn btn-primary btn-sm" },
};

export function InlineStatusAdvancer({
  pickupId,
  initialStatus,
  billId,
}: {
  pickupId: number;
  initialStatus: string;
  billId?: number | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = NEXT[status];

  async function advance() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/pickup/${pickupId}/status`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error");
      } else {
        setStatus(data.newStatus);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 4 }}>
      {next && (
        <button
          className={next.cls}
          style={{ gap: 5, fontSize: "0.76rem", padding: "4px 10px" }}
          onClick={advance}
          disabled={loading}
        >
          {loading ? <Loader2 size={12} className="spin" /> : next.icon}
          {loading ? "…" : next.label}
        </button>
      )}
      {status === "collected" && (
        <Link
          href={`/partner-portal/generate-bill/${pickupId}`}
          className="btn btn-primary btn-sm"
          style={{ gap: 5, fontSize: "0.76rem", padding: "4px 10px" }}
        >
          <FileText size={12} /> Generate Bill
        </Link>
      )}
      {status === "completed" && billId && (
        <Link
          href={`/bill/${billId}`}
          className="btn btn-secondary btn-sm"
          style={{ gap: 5, fontSize: "0.76rem", padding: "4px 10px" }}
        >
          <FileText size={12} /> View Bill
        </Link>
      )}
      {error && (
        <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{error}</span>
      )}
    </div>
  );
}
