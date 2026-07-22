import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  IndianRupee,
  Leaf,
  Navigation2,
  PackageCheck,
  Recycle,
  Truck,
} from "lucide-react";
import db from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, statusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await requireUser();
  const [stats] = (await db`
    SELECT COUNT(*)::int AS total, 
           SUM(CASE WHEN status IN ('pending','scheduled','collected') THEN 1 ELSE 0 END)::int AS active, 
           COALESCE(SUM(CASE WHEN status='completed' THEN weight_kg ELSE 0 END),0)::double precision AS recycled, 
           COALESCE(SUM(CASE WHEN status='completed' THEN estimated_value ELSE 0 END),0)::double precision AS earned 
    FROM pickup_requests 
    WHERE user_id = ${user.id}
  `) as unknown as {
    total: number;
    active: number;
    recycled: number;
    earned: number;
  }[];
  const [impact] = (await db`
    SELECT COALESCE(SUM(co2_saved_kg),0)::double precision AS co2, 
           COALESCE(SUM(trees_equivalent),0)::double precision AS trees 
    FROM impact_entries 
    WHERE user_id = ${user.id}
  `) as unknown as { co2: number; trees: number }[];
  const pickups = (await db`
    SELECT p.id, p.request_no, p.weight_kg, p.estimated_value, p.preferred_date, p.status, m.name AS material_name 
    FROM pickup_requests p 
    JOIN materials m ON m.id = p.material_id 
    WHERE p.user_id = ${user.id} 
    ORDER BY p.created_at DESC 
    LIMIT 6
  `) as unknown as {
    id: number;
    request_no: string;
    weight_kg: number;
    estimated_value: number;
    preferred_date: string;
    status: string;
    material_name: string;
  }[];
  const notifications = (await db`
    SELECT title, message, created_at 
    FROM notifications 
    WHERE user_id = ${user.id} 
    ORDER BY created_at DESC 
    LIMIT 3
  `) as unknown as { title: string; message: string; created_at: string }[];
  return (
    <div className="container page stack" style={{ gap: 28 }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Personal command center</span>
          <h2>Welcome, {user.name}.</h2>
          <p className="muted">
            Track collections, value recovery and environmental progress.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/profile" className="btn btn-secondary">
            My Profile
          </Link>
          <Link href="/dashboard/request-pickup" className="btn btn-primary">
            <Truck size={18} /> New pickup
          </Link>
        </div>
      </div>
      <div className="grid grid-4">
        <div className="metric">
          <PackageCheck size={20} />
          <strong>{stats.total}</strong>
          <span>Total requests</span>
        </div>
        <div className="metric">
          <CalendarClock size={20} />
          <strong>{stats.active || 0}</strong>
          <span>Active pickups</span>
        </div>
        <div className="metric">
          <Recycle size={20} />
          <strong>{stats.recycled} kg</strong>
          <span>Material recycled</span>
        </div>
        <div className="metric">
          <IndianRupee size={20} />
          <strong>{formatCurrency(stats.earned)}</strong>
          <span>Recovered value</span>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="glass card" style={{ gridColumn: "span 2" }}>
          <div className="row between">
            <div>
              <span className="eyebrow">Recent activity</span>
              <h3>Your pickup requests</h3>
            </div>
            <Link
              href="/dashboard/request-pickup"
              className="btn btn-secondary btn-sm"
            >
              Create request
            </Link>
          </div>
          {pickups.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Material</th>
                    <th>Weight</th>
                    <th>Date</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((p) => (
                    <tr key={p.id}>
                      <td>{p.request_no}</td>
                      <td>{p.material_name}</td>
                      <td>{p.weight_kg} kg</td>
                      <td>{formatDate(p.preferred_date)}</td>
                      <td>{formatCurrency(p.estimated_value)}</td>
                      <td>
                        <span className={`badge badge-${p.status}`}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td>
                        {["pending", "scheduled", "collected"].includes(p.status) && (
                          <Link
                            href={`/dashboard/track/${p.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ gap: 5, fontSize: "0.78rem", padding: "4px 10px" }}
                          >
                            <Navigation2 size={12} /> Track
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No pickup requests yet.</div>
          )}
        </div>
        <aside className="stack">
          <div className="glass card">
            <span className="eyebrow">Your impact</span>
            <div className="metric" style={{ marginTop: 14 }}>
              <Leaf size={20} />
              <strong>{impact.co2.toFixed(1)} kg</strong>
              <span>CO₂ saved</span>
            </div>
            <div className="metric" style={{ marginTop: 12 }}>
              <Recycle size={20} />
              <strong>{impact.trees.toFixed(1)}</strong>
              <span>Tree equivalent</span>
            </div>
            <Link
              href="/impact"
              className="btn btn-secondary"
              style={{ marginTop: 14, width: "100%" }}
            >
              View impact <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
      <div className="glass card">
        <div className="row">
          <Bell size={20} color="var(--secondary)" />
          <div>
            <span className="eyebrow">Notifications</span>
            <h3 style={{ margin: 0 }}>Latest updates</h3>
          </div>
        </div>
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {notifications.length ? (
            notifications.map((n, i) => (
              <div className="card soft" key={i}>
                <strong>{n.title}</strong>
                <p
                  className="muted"
                  style={{ fontSize: ".85rem", margin: "7px 0 0" }}
                >
                  {n.message}
                </p>
              </div>
            ))
          ) : (
            <p className="muted">No notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
}
