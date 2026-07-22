import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react";
import Link from "next/link";
import { ProfileEditForm } from "@/components/partner/profile-edit-form";
import { ChangePasswordForm } from "@/components/partner/change-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile – Scrapix Partner Portal",
  description: "View and edit your pickup partner profile details.",
};

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

export default async function PartnerProfilePage() {
  // Auth guard
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
    SELECT id, name, email, phone, service_area, vehicle_type,
           landmark, city, state, pincode, latitude, longitude,
           is_verified, status, created_at
    FROM pickup_partners
    WHERE id = ${partnerId}
  `) as unknown as {
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
  }[];

  if (!partner || !partner.is_verified) redirect("/partner/login");

  return (
    <div className="container page stack" style={{ gap: 32 }}>
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
            <span className="eyebrow">Pickup Partner Portal</span>
            <h2 style={{ marginBottom: 6 }}>My Profile</h2>
            <p className="muted">View and edit your personal and service details.</p>
          </div>
          <span className="badge badge-approved" style={{ gap: 6, padding: "10px 16px" }}>
            <CheckCircle2 size={14} /> Verified Agent
          </span>
        </div>
      </div>

      {/* Profile summary + edit form side-by-side on large screens */}
      <div className="grid grid-2" style={{ gap: 28, alignItems: "start" }}>

        {/* Left – Read-only summary */}
        <div className="glass card stack" style={{ gap: 20 }}>
          <span className="eyebrow">Profile Summary</span>

          {/* Avatar + name */}
          <div className="row" style={{ gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "grid",
                placeItems: "center",
                color: "#002817",
                flexShrink: 0,
              }}
            >
              <User size={28} />
            </div>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{partner.name}</strong>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{partner.email}</p>
              <span
                className={`badge badge-${partner.status}`}
                style={{ marginTop: 6, textTransform: "capitalize" }}
              >
                {partner.status}
              </span>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: 0 }} />

          {/* Detail rows */}
          <div className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem" }}>
              <Phone size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <span>{partner.phone}</span>
            </div>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem" }}>
              <Mail size={15} style={{ color: "var(--secondary)", flexShrink: 0 }} />
              <span>{partner.email}</span>
            </div>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem", alignItems: "flex-start" }}>
              <MapPin size={15} style={{ color: "var(--tertiary)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div>{partner.service_area}</div>
                {(partner.city || partner.state || partner.pincode) && (
                  <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    {[partner.landmark, partner.city, partner.state, partner.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            </div>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem" }}>
              <Truck size={15} style={{ color: "var(--warning)", flexShrink: 0 }} />
              <span>{vehicleLabel[partner.vehicle_type] ?? partner.vehicle_type}</span>
            </div>
            {partner.latitude != null && partner.longitude != null && (
              <div className="row" style={{ gap: 10, fontSize: "0.82rem", color: "var(--muted)" }}>
                <span>📍</span>
                <span>{partner.latitude.toFixed(5)}, {partner.longitude.toFixed(5)}</span>
              </div>
            )}
            <div className="row" style={{ gap: 10, fontSize: "0.82rem", color: "var(--muted)" }}>
              <Calendar size={14} style={{ flexShrink: 0 }} />
              <span>Joined {formatDate(partner.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Right – Edit form + Change password */}
        <div className="stack" style={{ gap: 24 }}>
          <div className="glass card stack" style={{ gap: 20 }}>
            <div>
              <span className="eyebrow">Edit Details</span>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.88rem" }}>
                Update your contact info, vehicle type, and service location.
              </p>
            </div>

            <ProfileEditForm partner={partner} />
          </div>

          {/* Change Password card */}
          <div className="glass card stack" style={{ gap: 16 }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--warning)" }}>Security</span>
              <h3 style={{ margin: "6px 0 4px", fontSize: "1.05rem" }}>Change Password</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Update your login password. You'll need your current password to confirm.
              </p>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: 0 }} />
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      {/* Back / Sign-out actions */}
      <div className="row" style={{ gap: 12, justifyContent: "center" }}>
        <Link href="/partner-portal" className="btn btn-ghost btn-sm">
          ← Back to Portal
        </Link>
        <Link href="/api/partner/logout" className="btn btn-ghost btn-sm">
          Sign out
        </Link>
      </div>
    </div>
  );
}
