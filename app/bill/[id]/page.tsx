import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, FileX } from "lucide-react";
import { BillDocuments } from "@/components/ui/bill-documents";

export const dynamic = "force-dynamic";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export const metadata = {
  title: "E-Bill – Scrapix",
  description: "View and download your e-bill for a completed scrap pickup.",
};

// Resolve which user/role is viewing and compute their back-link
async function resolveViewer(): Promise<{
  role: "customer" | "partner" | "admin";
  userId?: number;
  partnerId?: number;
  backHref: string;
  backLabel: string;
} | null> {
  const store = await cookies();

  const customerToken = store.get("scrapix_session")?.value;
  if (customerToken) {
    try {
      const { payload } = await jwtVerify(customerToken, secret);
      const role = String(payload.role) as "customer" | "admin";
      if (role === "admin") return { role: "admin", backHref: "/admin", backLabel: "Admin Panel" };
      if (role === "customer")
        return { role: "customer", userId: Number(payload.id), backHref: "/dashboard", backLabel: "Dashboard" };
    } catch {}
  }

  const partnerToken = store.get("scrapix_partner_session")?.value;
  if (partnerToken) {
    try {
      const { payload } = await jwtVerify(partnerToken, secret);
      if (payload.role === "pickup_partner")
        return {
          role: "partner",
          partnerId: Number(payload.id),
          backHref: "/partner-portal",
          backLabel: "Partner Portal",
        };
    } catch {}
  }

  return null;
}

export default async function BillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const billId = Number(id);
  if (isNaN(billId)) redirect("/");

  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  // Fetch bill
  const [bill] = (await db`
    SELECT
      e.id, e.bill_no, e.actual_weight_kg, e.rate_per_kg,
      e.gross_amount, e.platform_fee, e.net_payable, e.notes, e.created_at,
      e.customer_id, e.partner_id,
      m.name AS material_name, m.category AS material_category,
      u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
      u.address AS customer_address, u.city AS customer_city, u.state AS customer_state,
      u.bank_account_number, u.bank_ifsc_code, u.bank_name,
      pp.name AS partner_name, pp.phone AS partner_phone,
      pr.request_no, pr.preferred_date
    FROM ebills e
    JOIN materials m ON m.id = e.material_id
    JOIN users u ON u.id = e.customer_id
    JOIN pickup_partners pp ON pp.id = e.partner_id
    JOIN pickup_requests pr ON pr.id = e.pickup_id
    WHERE e.id = ${billId}
  `) as unknown as {
    id: number;
    bill_no: string;
    actual_weight_kg: number;
    rate_per_kg: number;
    gross_amount: number;
    platform_fee: number;
    net_payable: number;
    notes: string;
    created_at: string;
    customer_id: number;
    partner_id: number;
    material_name: string;
    material_category: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_state: string;
    bank_account_number: string;
    bank_ifsc_code: string;
    bank_name: string;
    partner_name: string;
    partner_phone: string;
    request_no: string;
    preferred_date: string;
  }[];

  // Authorization check
  if (!bill) {
    return <NotFound backHref={viewer.backHref} backLabel={viewer.backLabel} />;
  }
  if (viewer.role === "customer" && bill.customer_id !== viewer.userId) {
    return <NotFound backHref={viewer.backHref} backLabel={viewer.backLabel} />;
  }
  if (viewer.role === "partner" && bill.partner_id !== viewer.partnerId) {
    return <NotFound backHref={viewer.backHref} backLabel={viewer.backLabel} />;
  }

  return (
    <div className="container page stack" style={{ gap: 24 }}>
      <div>
        <Link
          href={viewer.backHref}
          className="row muted"
          style={{ gap: 6, fontSize: "0.84rem", display: "inline-flex", marginBottom: 18 }}
        >
          <ArrowLeft size={14} /> {viewer.backLabel}
        </Link>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">
              {viewer.role === "admin"
                ? "Admin · E-Bill View"
                : viewer.role === "partner"
                ? "Partner Portal · E-Bill"
                : "Your Payment Bill"}
            </span>
            <h2 style={{ marginBottom: 6 }}>E-Bill {bill.bill_no}</h2>
            <p className="muted">View and download your e-bill or green certificate.</p>
          </div>
        </div>
      </div>

      <BillDocuments
        bill={bill}
        showBankWarning={viewer.role === "customer" && !bill.bank_account_number}
      />
    </div>
  );
}

function NotFound({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="container page" style={{ textAlign: "center" }}>
      <div className="glass card" style={{ padding: 48, maxWidth: 480, margin: "0 auto" }}>
        <FileX size={42} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>Bill not found</h3>
        <p className="muted">
          This e-bill doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link href={backHref} className="btn btn-secondary" style={{ marginTop: 20 }}>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
