import { Building2, PackageCheck, Recycle, Users } from "lucide-react";
import db from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";
import {
  PartnerDecisionActions,
  PickupStatusAction,
} from "@/components/admin-actions";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireUser(["admin"]);
  const [{ count: userCount }] = await db`SELECT COUNT(*)::int AS count FROM users`;
  const [{ count: pickupCount }] = await db`SELECT COUNT(*)::int AS count FROM pickup_requests`;
  const [{ count: partnerCount }] = await db`SELECT COUNT(*)::int AS count FROM partner_profiles WHERE status = 'approved'`;
  const [{ value: recycledValue }] = await db`SELECT COALESCE(SUM(recycled_kg),0)::double precision AS value FROM impact_entries`;

  const totals = {
    users: userCount,
    pickups: pickupCount,
    partners: partnerCount,
    recycled: recycledValue,
  };
  const pickups = (await db`
    SELECT p.id, p.request_no, p.weight_kg, p.estimated_value, p.preferred_date, p.status, u.name AS user_name, m.name AS material_name 
    FROM pickup_requests p 
    JOIN users u ON u.id = p.user_id 
    JOIN materials m ON m.id = p.material_id 
    ORDER BY p.created_at DESC 
    LIMIT 20
  `) as unknown as {
    id: number;
    request_no: string;
    weight_kg: number;
    estimated_value: number;
    preferred_date: string;
    status: string;
    user_name: string;
    material_name: string;
  }[];
  const partners = (await db`
    SELECT pp.id, pp.business_name, pp.business_type, pp.city, pp.monthly_capacity_kg, pp.status, u.name, u.email 
    FROM partner_profiles pp 
    JOIN users u ON u.id = pp.user_id 
    ORDER BY pp.created_at DESC
  `) as unknown as {
    id: number;
    business_name: string;
    business_type: string;
    city: string;
    monthly_capacity_kg: number;
    status: string;
    name: string;
    email: string;
  }[];
  return (
    <div className="container page stack" style={{ gap: 28 }}>
      <div>
        <span className="eyebrow">Administration</span>
        <h2>Scrapix operations center.</h2>
        <p className="muted">
          Manage collection workflow, partner verification and platform
          performance.
        </p>
      </div>
      <div className="grid grid-4">
        <div className="metric">
          <Users />
          <strong>{totals.users}</strong>
          <span>Platform users</span>
        </div>
        <div className="metric">
          <PackageCheck />
          <strong>{totals.pickups}</strong>
          <span>Pickup requests</span>
        </div>
        <div className="metric">
          <Building2 />
          <strong>{totals.partners}</strong>
          <span>Approved partners</span>
        </div>
        <div className="metric">
          <Recycle />
          <strong>{totals.recycled} kg</strong>
          <span>Verified recycling</span>
        </div>
      </div>
      <section className="glass card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Operations</span>
            <h3>Pickup request management</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Customer</th>
                <th>Material</th>
                <th>Weight</th>
                <th>Date</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.id}>
                  <td>{p.request_no}</td>
                  <td>{p.user_name}</td>
                  <td>{p.material_name}</td>
                  <td>{p.weight_kg} kg</td>
                  <td>{formatDate(p.preferred_date)}</td>
                  <td>{formatCurrency(p.estimated_value)}</td>
                  <td>
                    <PickupStatusAction id={p.id} current={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="glass card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Compliance</span>
            <h3>Partner applications</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Applicant</th>
                <th>Type</th>
                <th>City</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td>{p.business_name}</td>
                  <td>
                    {p.name}
                    <br />
                    <small className="muted">{p.email}</small>
                  </td>
                  <td>{statusLabel(p.business_type)}</td>
                  <td>{p.city}</td>
                  <td>{p.monthly_capacity_kg} kg/mo</td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td>
                    {p.status === "pending" ? (
                      <PartnerDecisionActions id={p.id} />
                    ) : (
                      <span className="muted">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
