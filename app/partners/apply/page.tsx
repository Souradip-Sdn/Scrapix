import db from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PartnerWizard } from "@/components/forms/partner-wizard";
export const dynamic = "force-dynamic";
export default async function PartnerApplyPage() {
  const user = await requireUser();
  const [profile] = (await db`
    SELECT status FROM partner_profiles WHERE user_id = ${user.id}
  `) as unknown as { status: string }[];
  return (
    <div className="container page">
      <div className="grid grid-3" style={{ alignItems: "start" }}>
        <div style={{ gridColumn: "span 2" }}>
          <PartnerWizard existingStatus={profile?.status} />
        </div>
        <aside className="stack">
          <div className="glass card">
            <span className="eyebrow">Why join the network?</span>
            <div className="stack" style={{ marginTop: 18 }}>
              {[
                {
                  t: "Global reach",
                  d: "Connect with thousands of verified eco-conscious customers.",
                },
                {
                  t: "Data insights",
                  d: "Access real-time analytics on sustainability trends.",
                },
                {
                  t: "Impact tracking",
                  d: "Automated ESG reporting tools built into operations.",
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="row"
                  style={{ alignItems: "flex-start" }}
                >
                  <span style={{ color: "var(--tertiary)" }}>●</span>
                  <div>
                    <strong>{x.t}</strong>
                    <p
                      className="muted"
                      style={{ fontSize: ".82rem", margin: 0 }}
                    >
                      {x.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass card">
            <h3>Need assistance?</h3>
            <p className="muted">
              Our technical onboarding team can help map your workflow.
            </p>
            <a
              className="btn btn-secondary btn-sm"
              href="mailto:partners@scrapix.local"
            >
              Contact support
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
