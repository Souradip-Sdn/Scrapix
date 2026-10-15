import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, IndianRupee, Package, Scale, User } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-dynamic";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export default async function PartnerBillViewPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId: rawId } = await params;
  const billId = Number(rawId);

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

  if (isNaN(billId)) redirect("/partner-portal");

  const [bill] = (await db`
    SELECT
      e.id, e.bill_no, e.actual_weight_kg, e.rate_per_kg,
      e.gross_amount, e.platform_fee, e.net_payable, e.notes, e.created_at,
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
      AND e.partner_id = ${partnerId}
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

  if (!bill) redirect("/partner-portal");

  return (
    <div className="container page stack" style={{ gap: 24 }}>
      <div>
        <Link
          href="/partner-portal"
          className="row muted"
          style={{ gap: 6, fontSize: "0.84rem", display: "inline-flex", marginBottom: 18 }}
        >
          <ArrowLeft size={14} /> Back to Portal
        </Link>
      </div>

      <EBillCard bill={bill} mode="partner" />
    </div>
  );
}

// Exported for reuse (also used on customer side)
export function EBillCard({
  bill,
  mode,
}: {
  bill: {
    bill_no: string;
    request_no: string;
    actual_weight_kg: number;
    rate_per_kg: number;
    gross_amount: number;
    platform_fee: number;
    net_payable: number;
    notes: string;
    created_at: string;
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
  };
  mode: "partner" | "customer";
}) {
  return (
    <div
      id="ebill-card"
      className="glass card stack"
      style={{ gap: 0, maxWidth: 760, margin: "0 auto", width: "100%" }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(80,255,175,0.12), rgba(150,237,255,0.08))",
          borderBottom: "1px solid rgba(80,255,175,0.15)",
          padding: "28px 32px",
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Scrapix Logo" className="brand-logo" style={{ height: 42, width: "auto", display: "block" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-text.png" alt="Scrapix" className="brand-logo" style={{ height: 32, width: "auto", display: "block" }} />
            </div>
            <span className="eyebrow" style={{ display: "block", margin: "0 0 4px" }}>Official E-Bill</span>
            <p className="muted" style={{ margin: 0, fontSize: "0.84rem" }}>
              E-WASTE & ALL SCRAP COLLECTION SOLUTIONS
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              className="badge badge-approved"
              style={{ gap: 6, padding: "8px 14px", fontSize: "0.9rem" }}
            >
              <CheckCircle2 size={14} /> Issued
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontFamily: "monospace",
                color: "var(--secondary)",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            >
              {bill.bill_no}
            </p>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
              {formatDate(bill.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="stack" style={{ gap: 24, padding: "28px 32px" }}>
        {/* Parties */}
        <div className="grid grid-2" style={{ gap: 20 }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="row" style={{ gap: 7, color: "var(--secondary)" }}>
              <User size={14} />
              <span className="eyebrow" style={{ color: "var(--secondary)" }}>Seller (Customer)</span>
            </div>
            <strong style={{ fontSize: "1rem" }}>{bill.customer_name}</strong>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{bill.customer_email}</p>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{bill.customer_phone}</p>
            <p className="muted" style={{ margin: 0, fontSize: "0.83rem" }}>
              {bill.customer_address}, {bill.customer_city}, {bill.customer_state}
            </p>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="row" style={{ gap: 7, color: "var(--primary)" }}>
              <Building2 size={14} />
              <span className="eyebrow" style={{ color: "var(--primary)" }}>Buyer (Pickup Partner)</span>
            </div>
            <strong style={{ fontSize: "1rem" }}>{bill.partner_name}</strong>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{bill.partner_phone}</p>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Ref: {bill.request_no}
            </p>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: 0 }} />

        {/* Item Details */}
        <div>
          <div className="row" style={{ gap: 7, color: "var(--muted)", marginBottom: 14 }}>
            <Package size={14} />
            <span className="eyebrow">Item Details</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Rate / kg</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{bill.material_name}</strong></td>
                  <td className="muted">{bill.material_category}</td>
                  <td>
                    <span className="row" style={{ gap: 5 }}>
                      <Scale size={13} style={{ color: "var(--primary)" }} />
                      {bill.actual_weight_kg} kg
                    </span>
                  </td>
                  <td>{formatCurrency(bill.rate_per_kg)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(bill.gross_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount Summary */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <div className="stack" style={{ gap: 10, maxWidth: 340, marginLeft: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span className="muted">Gross Amount</span>
              <span>{formatCurrency(bill.gross_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span className="muted">Platform Fee</span>
              <span className="muted">{formatCurrency(bill.platform_fee)}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "1rem" }}>Net Payable</strong>
              <strong
                style={{ fontSize: "1.6rem", color: "var(--primary)", letterSpacing: "-0.02em" }}
              >
                {formatCurrency(bill.net_payable)}
              </strong>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {(bill.bank_account_number || bill.bank_name) && (
          <div
            style={{
              background: "rgba(80,255,175,0.05)",
              border: "1px solid rgba(80,255,175,0.15)",
              borderRadius: 14,
              padding: "18px 22px",
            }}
          >
            <div className="row" style={{ gap: 7, marginBottom: 12, color: "var(--primary)" }}>
              <IndianRupee size={14} />
              <span className="eyebrow" style={{ color: "var(--primary)" }}>Payment Transfer Details</span>
            </div>
            <div className="grid grid-3" style={{ gap: 14, fontSize: "0.88rem" }}>
              {bill.bank_name && (
                <div>
                  <span className="muted" style={{ display: "block", fontSize: "0.78rem" }}>Bank</span>
                  <strong>{bill.bank_name}</strong>
                </div>
              )}
              {bill.bank_account_number && (
                <div>
                  <span className="muted" style={{ display: "block", fontSize: "0.78rem" }}>Account No.</span>
                  <strong style={{ fontFamily: "monospace" }}>{bill.bank_account_number}</strong>
                </div>
              )}
              {bill.bank_ifsc_code && (
                <div>
                  <span className="muted" style={{ display: "block", fontSize: "0.78rem" }}>IFSC Code</span>
                  <strong style={{ fontFamily: "monospace" }}>{bill.bank_ifsc_code}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {bill.notes && (
          <div>
            <span className="eyebrow">Notes</span>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.88rem" }}>
              {bill.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
            This is a computer-generated e-bill. No physical signature required.
            <br />
            Scrapix E-Waste Recycling Network © {new Date().getFullYear()}
          </p>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
