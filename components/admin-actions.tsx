"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export function PickupStatusAction({
  id,
  current,
}: {
  id: number;
  current: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <select
      value={current}
      disabled={loading}
      onChange={async (e) => {
        setLoading(true);
        await fetch(`/api/admin/pickups/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: e.target.value }),
        });
        setLoading(false);
        router.refresh();
      }}
      style={{ minWidth: 140 }}
    >
      {["pending", "scheduled", "collected", "completed", "cancelled"].map(
        (v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ),
      )}
    </select>
  );
}
export function PartnerDecisionActions({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function decide(status: "approved" | "rejected") {
    setLoading(true);
    await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }
  return (
    <div className="row">
      {loading ? (
        <LoaderCircle className="spin" size={18} />
      ) : (
        <>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => decide("approved")}
          >
            Approve
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => decide("rejected")}
          >
            Reject
          </button>
        </>
      )}
    </div>
  );
}
