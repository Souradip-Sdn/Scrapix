import { requireUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Mail, MapPin, Phone, User } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ProfileEditForm, CustomerProfileData } from "@/components/customer/profile-edit-form";
import { ChangePasswordForm } from "@/components/customer/change-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile – Scrapix Dashboard",
  description: "View and edit your personal details.",
};

export default async function CustomerProfilePage() {
  const sessionUser = await requireUser();

  const [customer] = (await db`
    SELECT u.id, u.name, u.email, u.phone, u.address, u.city, u.state, u.pincode, u.latitude, u.longitude, u.created_at,
           u.bank_account_number, u.bank_ifsc_code, u.bank_name,
           o.company_name, o.org_type, o.gst_number
    FROM users u
    LEFT JOIN organization_profiles o ON o.user_id = u.id
    WHERE u.id = ${sessionUser.id}
  `) as unknown as {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    bank_account_number: string | null;
    bank_ifsc_code: string | null;
    bank_name: string | null;
    company_name: string | null;
    org_type: string | null;
    gst_number: string | null;
  }[];

  const profileData: CustomerProfileData = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    latitude: customer.latitude,
    longitude: customer.longitude,
    bank_account_number: customer.bank_account_number || "",
    bank_ifsc_code: customer.bank_ifsc_code || "",
    bank_name: customer.bank_name || "",
    company_name: customer.company_name ?? undefined,
    org_type: customer.org_type ?? undefined,
    gst_number: customer.gst_number ?? undefined,
  };

  return (
    <div className="container page stack" style={{ gap: 32 }}>
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
            <span className="eyebrow">Personal command center</span>
            <h2 style={{ marginBottom: 6 }}>My Profile</h2>
            <p className="muted">View and edit your personal details and preferences.</p>
          </div>
          {customer.company_name && (
            <span className="badge badge-approved" style={{ gap: 6, padding: "10px 16px" }}>
              <Building2 size={14} /> Organization
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 28, alignItems: "start" }}>
        
        {/* Left - Read-only summary */}
        <div className="glass card stack" style={{ gap: 20 }}>
          <span className="eyebrow">Profile Summary</span>

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
              <strong style={{ fontSize: "1.1rem" }}>{customer.name}</strong>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{customer.email}</p>
              {customer.company_name && (
                <div style={{ fontSize: "0.82rem", color: "var(--primary)", marginTop: 4 }}>
                  {customer.company_name}
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: 0 }} />

          <div className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem" }}>
              <Phone size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <span>{customer.phone}</span>
            </div>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem" }}>
              <Mail size={15} style={{ color: "var(--secondary)", flexShrink: 0 }} />
              <span>{customer.email}</span>
            </div>
            <div className="row" style={{ gap: 10, fontSize: "0.9rem", alignItems: "flex-start" }}>
              <MapPin size={15} style={{ color: "var(--tertiary)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div>{customer.address || "No address provided"}</div>
                {(customer.city || customer.state || customer.pincode) && (
                  <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
                    {[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </div>
            {customer.latitude != null && customer.longitude != null && (
              <div className="row" style={{ gap: 10, fontSize: "0.82rem", color: "var(--muted)" }}>
                <span>📍</span>
                <span>{customer.latitude.toFixed(5)}, {customer.longitude.toFixed(5)}</span>
              </div>
            )}
            <div className="row" style={{ gap: 10, fontSize: "0.82rem", color: "var(--muted)" }}>
              <Calendar size={14} style={{ flexShrink: 0 }} />
              <span>Joined {formatDate(customer.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Right - Edit form + Change password */}
        <div className="stack" style={{ gap: 24 }}>
          <div className="glass card stack" style={{ gap: 20 }}>
            <div>
              <span className="eyebrow">Edit Details</span>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.88rem" }}>
                Update your contact info and location.
              </p>
            </div>
            <ProfileEditForm user={profileData} />
          </div>

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
    </div>
  );
}
