import { requireUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Phone, Truck, User } from "lucide-react";
import { PickupTrackingMapWrapper as PickupTrackingMap } from "@/components/tracking/pickup-tracking-map-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Track Pickup – Scrapix",
  description: "Live map tracking for your e-waste pickup request.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackPickupPage({ params }: PageProps) {
  const { id } = await params;
  const pickupId = Number(id);
  if (!pickupId) notFound();

  const user = await requireUser();

  const [row] = (await db`
    SELECT p.id, p.status, p.request_no,
           p.address, p.city, p.pincode, p.preferred_date, p.weight_kg,
           p.partner_lat, p.partner_lng, p.partner_last_seen,
           u.latitude  AS customer_lat,
           u.longitude AS customer_lng,
           pp.name     AS partner_name,
           pp.phone    AS partner_phone,
           pp.vehicle_type,
           m.name      AS material_name
    FROM pickup_requests p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN pickup_partners pp ON pp.id = p.partner_id
    JOIN materials m ON m.id = p.material_id
    WHERE p.id = ${pickupId}
      AND p.user_id = ${user.id}
  `) as unknown as {
    id: number;
    status: string;
    request_no: string;
    address: string;
    city: string;
    pincode: string;
    preferred_date: string;
    weight_kg: number;
    customer_lat: number | null;
    customer_lng: number | null;
    partner_lat: number | null;
    partner_lng: number | null;
    partner_last_seen: string | null;
    partner_name: string | null;
    partner_phone: string | null;
    vehicle_type: string | null;
    material_name: string;
  }[];

  if (!row) notFound();

  const vehicleLabel: Record<string, string> = {
    two_wheeler: "Two Wheeler",
    three_wheeler: "Auto / Three Wheeler",
    pickup_truck: "Pickup Truck",
    mini_truck: "Mini Truck",
    large_truck: "Large Truck",
  };

  const trackable = ["pending", "scheduled", "collected"].includes(row.status);

  return (
    <div className="container page stack" style={{ gap: 28 }}>
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="row muted"
          style={{ gap: 6, fontSize: "0.84rem", display: "inline-flex", marginBottom: 18 }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">Live Tracking</span>
            <h2 style={{ marginBottom: 6 }}>
              {row.request_no}
            </h2>
            <p className="muted">
              {trackable
                ? "Your partner's location is updated every 5 seconds."
                : `This pickup is marked as ${row.status} and is no longer actively tracked.`}
            </p>
          </div>
          <span
            className={`badge badge-${row.status}`}
            style={{ textTransform: "capitalize", padding: "10px 16px" }}
          >
            {row.status}
          </span>
        </div>
      </div>

      {/* Map + info */}
      <div className="grid grid-3" style={{ gap: 24, alignItems: "start" }}>

        {/* Map – takes 2/3 */}
        <div style={{ gridColumn: "span 2" }}>
          <div className="glass card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="eyebrow">Live Map</span>
              <h3 style={{ margin: "4px 0 0" }}>Partner location</h3>
            </div>
            <div style={{ padding: 20 }}>
              <PickupTrackingMap
                pickupId={row.id}
                initialData={{
                  status: row.status,
                  request_no: row.request_no,
                  address: row.address,
                  city: row.city,
                  customer_lat: row.customer_lat,
                  customer_lng: row.customer_lng,
                  partner_lat: row.partner_lat,
                  partner_lng: row.partner_lng,
                  partner_last_seen: row.partner_last_seen,
                  partner_name: row.partner_name,
                  partner_phone: row.partner_phone,
                  vehicle_type: row.vehicle_type,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <aside className="stack" style={{ gap: 20 }}>
          {/* Pickup details */}
          <div className="glass card stack" style={{ gap: 16 }}>
            <span className="eyebrow">Pickup Details</span>
            <div className="stack" style={{ gap: 12, fontSize: "0.9rem" }}>
              <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                <MapPin size={15} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div>{row.address}</div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {row.city} – {row.pincode}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <Package size={15} style={{ color: "var(--secondary)", flexShrink: 0 }} />
                <span>{row.material_name} · {row.weight_kg} kg</span>
              </div>
            </div>
          </div>

          {/* Partner details */}
          {row.partner_name ? (
            <div className="glass card stack" style={{ gap: 16 }}>
              <span className="eyebrow">Your Partner</span>
              <div className="row" style={{ gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--warning),var(--danger))",
                    display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <strong>{row.partner_name}</strong>
                  {row.vehicle_type && (
                    <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.82rem" }}>
                      <Truck size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      {vehicleLabel[row.vehicle_type] ?? row.vehicle_type}
                    </p>
                  )}
                </div>
              </div>
              {row.partner_phone && (
                <a
                  href={`tel:${row.partner_phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 7 }}
                >
                  <Phone size={13} /> Call Partner
                </a>
              )}
            </div>
          ) : (
            <div className="glass card" style={{ textAlign: "center", opacity: 0.7 }}>
              <User size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                A pickup partner will be assigned soon.
              </p>
            </div>
          )}

          {/* Status guide */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.82rem",
            }}
          >
            <p className="muted" style={{ margin: "0 0 8px", fontWeight: 600 }}>Status Guide</p>
            {[
              { s: "pending", label: "Awaiting partner assignment" },
              { s: "scheduled", label: "Partner assigned & on the way" },
              { s: "collected", label: "Items collected, going to facility" },
              { s: "completed", label: "Processing done ✓" },
            ].map(({ s, label }) => (
              <div key={s} className="row" style={{ gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: row.status === s ? "var(--primary)" : "rgba(255,255,255,0.18)",
                  }}
                />
                <span
                  style={{
                    color: row.status === s ? "var(--text)" : "var(--muted)",
                    fontWeight: row.status === s ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
