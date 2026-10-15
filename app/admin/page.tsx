import {
  PackageCheck,
  Recycle,
  Truck,
  Users,
} from "lucide-react";

import db from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";

import { PickupStatusAction } from "@/components/admin-actions";
import { PickupPartnersSection } from "@/components/admin/pickup-partners-section";
import Link from "next/link";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

interface PickupRequest {
  id: number;
  request_no: string;
  weight_kg: number;
  estimated_value: number;
  preferred_date: string;
  status: string;
  user_name: string;
  material_name: string;
  bill_id: number | null;
  actual_weight_kg: number | null;
  gross_amount: number | null;
}

interface PickupPartner {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_area: string;
  vehicle_type: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  registered_by_name: string;
}

export default async function AdminPage() {
  await requireUser(["admin"]);

  const [{ count: userCount }] = await db`
    SELECT COUNT(*)::int AS count
    FROM users
  `;

  const [{ count: pickupCount }] = await db`
    SELECT COUNT(*)::int AS count
    FROM pickup_requests
  `;

  const [{ value: recycledValue }] = await db`
    SELECT COALESCE(SUM(recycled_kg), 0)::double precision AS value
    FROM impact_entries
  `;

  const [{ count: pickupPartnerCount }] = await db`
    SELECT COUNT(*)::int AS count
    FROM pickup_partners
  `;

  const [{ count: verifiedPickupPartnerCount }] = await db`
    SELECT COUNT(*)::int AS count
    FROM pickup_partners
    WHERE is_verified = true
  `;

  const totals = {
    users: userCount,
    pickups: pickupCount,
    recycled: recycledValue,
    pickupPartners: pickupPartnerCount,
    verifiedPickupPartners: verifiedPickupPartnerCount,
  };

  const pickups = (await db`
    SELECT
      p.id,
      p.request_no,
      p.weight_kg,
      p.estimated_value,
      p.preferred_date,
      p.status,
      u.name AS user_name,
      m.name AS material_name,
      e.id AS bill_id,
      e.actual_weight_kg,
      e.gross_amount
    FROM pickup_requests p
    JOIN users u
      ON u.id = p.user_id
    JOIN materials m
      ON m.id = p.material_id
    LEFT JOIN ebills e
      ON e.pickup_id = p.id
    ORDER BY p.created_at DESC
    LIMIT 20
  `) as unknown as PickupRequest[];

  const pickupPartners = (await db`
    SELECT
      pp.id,
      pp.name,
      pp.email,
      pp.phone,
      pp.service_area,
      pp.vehicle_type,
      pp.landmark,
      pp.city,
      pp.state,
      pp.pincode,
      pp.latitude,
      pp.longitude,
      pp.is_verified,
      pp.status,
      pp.created_at,
      COALESCE(u.name, 'System Admin') AS registered_by_name
    FROM pickup_partners pp
    LEFT JOIN users u
      ON u.id = pp.registered_by
    ORDER BY pp.created_at DESC
  `) as unknown as PickupPartner[];

  return (
    <div
      className="container page stack"
      style={{
        gap: 28,
        position: "relative",
      }}
    >
      <div>
        <span className="eyebrow">Administration</span>
        <h2>Scrapix operations center.</h2>

        <p className="muted">
          Manage collection workflow, partner verification and
          platform performance.
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
          <Recycle />
          <strong>{totals.recycled} kg</strong>
          <span>Verified recycling</span>
        </div>



        <div className="metric">
          <Truck />
          <strong style={{ color: "var(--primary)" }}>
            {totals.verifiedPickupPartners}
          </strong>
          <span>Verified agents</span>
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
                <th></th>
              </tr>
            </thead>

            <tbody>
              {pickups.length > 0 ? (
                pickups.map((pickup) => (
                   <tr key={pickup.id}>
                     <td data-label="Request">{pickup.request_no}</td>
                     <td data-label="Customer">{pickup.user_name}</td>
                     <td data-label="Material">{pickup.material_name}</td>
                     <td data-label="Weight">
                      {pickup.actual_weight_kg && pickup.actual_weight_kg !== pickup.weight_kg ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 6 }}>{pickup.weight_kg} kg</span>
                          {pickup.actual_weight_kg} kg
                        </>
                      ) : (
                        <>{pickup.weight_kg} kg</>
                      )}
                    </td>
                     <td data-label="Date">{formatDate(pickup.preferred_date)}</td>
                     <td data-label="Value">
                      {pickup.gross_amount && pickup.gross_amount !== pickup.estimated_value ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 6 }}>{formatCurrency(pickup.estimated_value)}</span>
                          {formatCurrency(pickup.gross_amount)}
                        </>
                      ) : (
                        <>{formatCurrency(pickup.estimated_value)}</>
                      )}
                    </td>
                     <td data-label="Status">
                       <PickupStatusAction
                         id={pickup.id}
                         current={pickup.status}
                       />
                     </td>
                     <td data-label="">
                      {pickup.bill_id && (
                        <Link
                          href={`/bill/${pickup.bill_id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: 5, fontSize: "0.76rem", padding: "4px 10px" }}
                        >
                          <FileText size={12} /> E-Bill
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="muted"
                    style={{ textAlign: "center" }}
                  >
                    No pickup requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PickupPartnersSection
        initialPartners={pickupPartners}
      />
    </div>
  );
}