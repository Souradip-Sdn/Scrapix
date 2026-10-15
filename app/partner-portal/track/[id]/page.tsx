import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, Phone, Truck, User } from "lucide-react";
import { PartnerTrackingMapWrapper } from "@/components/tracking/partner-tracking-map-wrapper";
import { PickupStatusAdvancer } from "@/components/partner/pickup-status-advancer";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerTrackPage({ params }: PageProps) {
  const { id } = await params;
  const pickupId = Number(id);
  if (!pickupId) notFound();

  // Verify the partner session cookie
  let partnerId: number | null = null;
  try {
    const store = await cookies();
    const token = store.get("scrapix_partner_session")?.value;
    if (!token) redirect("/partner/login");
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "pickup_partner") redirect("/partner/login");
    partnerId = Number(payload.id);
  } catch {
    redirect("/partner/login");
  }

  // Fetch the pickup, verifying it belongs to the partner's service city
  const [partner] = (await db`
    SELECT city FROM pickup_partners WHERE id = ${partnerId}
  `) as unknown as { city: string }[];
  
  if (!partner) redirect("/partner/login");

  const [pickup] = (await db`
    SELECT p.id, p.status, p.request_no, p.weight_kg, p.preferred_date,
           p.address, p.city, p.pincode, p.notes,
           u.name AS customer_name, u.phone AS customer_phone,
           u.address AS customer_profile_address, u.city AS customer_profile_city,
           u.state AS customer_profile_state, u.pincode AS customer_profile_pincode,
           u.latitude AS customer_lat, u.longitude AS customer_lng,
           m.name AS material_name
    FROM pickup_requests p
    JOIN users u ON u.id = p.user_id
    JOIN materials m ON m.id = p.material_id
    WHERE p.id = ${pickupId}
      AND LOWER(p.city) = LOWER(${partner.city})
  `) as unknown as {
    id: number;
    status: string;
    request_no: string;
    weight_kg: number;
    preferred_date: string;
    address: string;
    city: string;
    pincode: string;
    notes: string;
    customer_name: string;
    customer_phone: string;
    customer_profile_address: string;
    customer_profile_city: string;
    customer_profile_state: string;
    customer_profile_pincode: string;
    customer_lat: number | null;
    customer_lng: number | null;
    material_name: string;
  }[];

  if (!pickup) notFound();

  const customerLat = pickup.customer_lat ?? 23.8310;
  const customerLng = pickup.customer_lng ?? 91.2860;

  return (
    <div className="container page stack" style={{ gap: 28 }}>
      {/* Header */}
      <div>
        <Link
          href="/partner-portal"
          className="row muted"
          style={{ gap: 6, fontSize: "0.84rem", display: "inline-flex", marginBottom: 18 }}
        >
          <ArrowLeft size={14} /> Back to Portal
        </Link>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">Partner Navigation</span>
            <h2 style={{ marginBottom: 6 }}>
              Route for {pickup.request_no}
            </h2>
            <p className="muted">
              Map directions to the customer's pickup address. Your location updates automatically.
            </p>
          </div>
          <span
            className={`badge badge-${pickup.status}`}
            style={{ textTransform: "capitalize", padding: "10px 16px" }}
          >
            {pickup.status}
          </span>
        </div>
      </div>

      {/* Map + info */}
      <div className="grid grid-3" style={{ gap: 24, alignItems: "start" }}>
        
        {/* Map – takes 2/3 */}
        <div style={{ gridColumn: "span 2" }}>
          <div className="glass card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="eyebrow">Navigation Map</span>
              <h3 style={{ margin: "4px 0 0" }}>Customer Location</h3>
            </div>
            <div style={{ padding: 20 }}>
              <PartnerTrackingMapWrapper
                pickupId={pickup.id}
                customerLat={customerLat}
                customerLng={customerLng}
                customerName={pickup.customer_name}
                address={pickup.address}
                city={pickup.city}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <aside className="stack" style={{ gap: 20 }}>
          {/* Customer Details */}
          <div className="glass card stack" style={{ gap: 16 }}>
            <span className="eyebrow">Customer Information</span>
            <div className="row" style={{ gap: 12 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--primary),var(--secondary))",
                  display: "grid", placeItems: "center", color: "#002817", flexShrink: 0,
                }}
              >
                <User size={20} />
              </div>
              <div>
                <strong>{pickup.customer_name}</strong>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.82rem" }}>
                  Customer
                </p>
              </div>
            </div>
            {pickup.customer_phone && (
              <a
                href={`tel:${pickup.customer_phone}`}
                className="btn btn-secondary btn-sm"
                style={{ gap: 7 }}
              >
                <Phone size={13} /> Call Customer
              </a>
            )}

            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "4px 0" }} />

            <div className="stack" style={{ gap: 8, fontSize: "0.85rem" }}>
              <div>
                <strong className="muted" style={{ display: "block", marginBottom: 2 }}>Profile Address:</strong>
                <div>{pickup.customer_profile_address || "No address in profile"}</div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {[pickup.customer_profile_city, pickup.customer_profile_state, pickup.customer_profile_pincode].filter(Boolean).join(", ")}
                </div>
              </div>
              {pickup.customer_lat && pickup.customer_lng && (
                <div className="muted" style={{ fontSize: "0.78rem" }}>
                  📍 Coordinates: {Number(pickup.customer_lat).toFixed(6)}, {Number(pickup.customer_lng).toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {/* Pickup Details */}
          <div className="glass card stack" style={{ gap: 16 }}>
            <span className="eyebrow">Item &amp; Address Details</span>
            <div className="stack" style={{ gap: 12, fontSize: "0.9rem" }}>
              <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                <MapPin size={15} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Pickup Address:</strong>
                  <div>{pickup.address}</div>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {pickup.city} – {pickup.pincode}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <Package size={15} style={{ color: "var(--secondary)", flexShrink: 0 }} />
                <span>{pickup.material_name} · {pickup.weight_kg} kg</span>
              </div>
              {pickup.notes && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: "0.82rem",
                  }}
                >
                  <strong className="muted" style={{ display: "block", marginBottom: 4 }}>Notes:</strong>
                  <span>{pickup.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Updater */}
          <div className="glass card stack" style={{ gap: 14 }}>
            <span className="eyebrow">Update Status</span>
            <p className="muted" style={{ margin: 0, fontSize: "0.83rem" }}>
              Advance the pickup status as you progress through the collection.
            </p>
            <PickupStatusAdvancer
              pickupId={pickup.id}
              initialStatus={pickup.status}
            />
          </div>

        </aside>
      </div>
    </div>
  );
}
