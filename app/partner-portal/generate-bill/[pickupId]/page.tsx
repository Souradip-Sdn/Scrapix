import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { GenerateBillForm } from "@/components/partner/generate-bill-form";

export const dynamic = "force-dynamic";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "development-only-secret-change-in-production",
);

export const metadata = {
  title: "Generate E-Bill – Scrapix Partner Portal",
  description: "Enter actual weight and material to generate a payment e-bill for the customer.",
};

export default async function GenerateBillPage({
  params,
}: {
  params: Promise<{ pickupId: string }>;
}) {
  const { pickupId: rawId } = await params;
  const pickupId = Number(rawId);

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

  if (isNaN(pickupId)) redirect("/partner-portal");

  return (
    <div className="container page stack" style={{ gap: 28 }}>
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
            <span className="eyebrow">E-Bill Generation</span>
            <h2 style={{ marginBottom: 6 }}>
              <FileText
                size={22}
                style={{ color: "var(--secondary)", verticalAlign: "middle", marginRight: 8 }}
              />
              Generate Payment Bill
            </h2>
            <p className="muted">
              Enter the actual weighed amount and select the collected material. An e-bill will be
              issued to the customer immediately.
            </p>
          </div>
        </div>
      </div>

      <GenerateBillForm pickupId={pickupId} partnerId={partnerId!} />
    </div>
  );
}
