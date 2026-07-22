import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  CheckCircle2,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
  User,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { BackgroundLocationSharer } from "@/components/tracking/background-location-sharer";

export const dynamic = "force-dynamic";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

const vehicleLabel: Record<string, string> = {
  two_wheeler: "Two Wheeler",
  three_wheeler: "Auto / Three Wheeler",
  pickup_truck: "Pickup Truck",
  mini_truck: "Mini Truck",
  large_truck: "Large Truck",
};

export default async function PartnerPortalPage() {
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

  const [partner] = (await db`
    SELECT id, name, email, phone, service_area, vehicle_type, city, is_verified, status, created_at
    FROM pickup_partners WHERE id = ${partnerId}
  `) as unknown as {
    id: number;
    name: string;
    email: string;
    phone: string;
    service_area: string;
    vehicle_type: string;
    city: string;
    is_verified: boolean;
    status: string;
    created_at: string;
  }[];

  if (!partner) redirect("/partner/login");
  if (!partner.is_verified) redirect("/partner/login");

  // Fetch assigned pickups (pending/scheduled for the partner's city area)
  const assignedPickups = (await db`
    SELECT p.id, p.request_no, p.weight_kg, p.estimated_value, p.preferred_date,
           p.status, p.address, p.city, p.pincode,
           u.name AS customer_name, u.phone AS customer_phone,
           m.name AS material_name
    FROM pickup_requests p
    JOIN users u ON u.id = p.user_id
    JOIN materials m ON m.id = p.material_id
    WHERE LOWER(p.city) = LOWER(${partner.city})
      AND p.status IN ('pending', 'scheduled', 'collected')
    ORDER BY p.preferred_date ASC
    LIMIT 10
  `) as unknown as {
    id: number;
    request_no: string;
    weight_kg: number;
    estimated_value: number;
    preferred_date: string;
    status: string;
    address: string;
    city: string;
    pincode: string;
    customer_name: string;
    customer_phone: string;
    material_name: string;
  }[];

  const statusColor: Record<string, string> = {
    pending: "badge-pending",
    scheduled: "badge-scheduled",
    collected: "badge-collected",
  };

  const activePickupIds = assignedPickups.map((p) => p.id);

  return (
    <div className="container page stack" style={{ gap: 28 }}>
      <BackgroundLocationSharer activePickupIds={activePickupIds} />

      {/* Header */}
      <div className="section-head">
        <div>
          <span className="eyebrow">Pickup Partner Portal</span>
          <h2>Welcome, {partner.name}.</h2>
          <p className="muted">
            Your field operations dashboard. Manage pickups in your service area.
          </p>
        </div>
        <span className="badge badge-approved" style={{ gap: 6, padding: "10px 16px" }}>
          <CheckCircle2 size={14} /> Verified Agent
        </span>
      </div>

      {/* Profile + Stats */}
      <div className="grid grid-3" style={{ gap: 24 }}>
        {/* Profile card */}
        <div className="glass card stack" style={{ gap: 16 }}>
          <span className="eyebrow">Your Profile</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row">
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid", placeItems: "center", color: "#002817", flexShrink: 0,
              }}>
                <User size={22} />
              </div>
              <div>
                <strong>{partner.name}</strong>
                <p className="muted" style={{ margin: 0, fontSize: "0.82rem" }}>{partner.email}</p>
              </div>
            </div>
            <div className="row" style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              <Phone size={14} /> {partner.phone}
            </div>
            <div className="row" style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              <MapPin size={14} /> {partner.service_area}
            </div>
            <div className="row" style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              <Truck size={14} /> {vehicleLabel[partner.vehicle_type] ?? partner.vehicle_type}
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge badge-${partner.status}`} style={{ textTransform: "capitalize" }}>
                {partner.status}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Link
                href="/partner-portal/profile"
                className="btn btn-secondary btn-sm"
                style={{ gap: 7 }}
              >
                <UserCog size={14} /> My Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="metric" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <PackageCheck size={28} style={{ color: "var(--secondary)" }} />
          <strong>{assignedPickups.length}</strong>
          <span>Pickups in your area</span>
        </div>
        <div className="metric" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <MapPin size={28} style={{ color: "var(--primary)" }} />
          <strong>{partner.service_area}</strong>
          <span>Service area</span>
        </div>
      </div>

      {/* Assigned Pickups */}
      <section className="glass card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Your Queue</span>
            <h3>Pickups in your area</h3>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
              Active requests in {partner.service_area}.
            </p>
          </div>
        </div>

        {assignedPickups.length === 0 ? (
          <div className="empty">
            <PackageCheck size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No active pickups in your area right now.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Material</th>
                  <th>Weight</th>
                  <th>Address</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignedPickups.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: "var(--secondary)", fontFamily: "monospace", fontSize: "0.88rem" }}>
                        {p.request_no}
                      </strong>
                    </td>
                    <td>
                      {p.customer_name}
                      <br />
                      <small className="muted">{p.customer_phone}</small>
                    </td>
                    <td>{p.material_name}</td>
                    <td>{p.weight_kg} kg</td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{p.address}</span>
                      <br />
                      <small className="muted">{p.city} – {p.pincode}</small>
                    </td>
                    <td>{formatDate(p.preferred_date)}</td>
                    <td>
                      <span className={`badge ${statusColor[p.status] ?? ""}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/partner-portal/track/${p.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ gap: 5, fontSize: "0.78rem", padding: "4px 10px" }}
                      >
                        <MapPin size={12} /> Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
