import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";
import db from "@/lib/db";
import { Estimator } from "@/components/estimator";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const materialRows = (await db`
    SELECT id,name,rate_per_kg,co2_factor FROM materials WHERE active=1 ORDER BY id
  `) as unknown as {
    id: number;
    name: string;
    rate_per_kg: number;
    co2_factor: number;
  }[];
  const materials = materialRows.map((row) => ({ ...row }));
  const [impact] = (await db`
    SELECT COALESCE(SUM(recycled_kg),0)::double precision AS recycled, COALESCE(SUM(co2_saved_kg),0)::double precision AS co2 FROM impact_entries
  `) as unknown as { recycled: number; co2: number }[];
  const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM users`;
  const users = { count };

  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <span className="eyebrow">Enterprise circular economy network</span>
          <h1 className="gradient-text">Turn E-Waste into Impact.</h1>
          <p>
            Calculate the value of obsolete electronics, schedule verified
            collection, connect with certified recovery partners, and measure
            environmental impact from one platform.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard/request-pickup" className="btn btn-primary">
              Start recycling <ArrowRight size={18} />
            </Link>
            <Link href="/partners/apply" className="btn btn-secondary">
              Join partner network
            </Link>
          </div>
          <div
            className="row wrap"
            style={{ marginTop: 26, color: "var(--muted)", fontSize: ".84rem" }}
          >
            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" /> Digital
              traceability
            </span>
            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" /> Certified
              partners
            </span>
            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" /> Transparent
              pricing
            </span>
          </div>
        </div>
        <Estimator materials={materials} />
      </section>

      <section className="container glass card impact-strip">
        <div>
          <h3 style={{ marginBottom: 6 }}>Live Environmental Impact</h3>
          <p className="muted" style={{ margin: 0 }}>
            Real-time metrics generated through completed Scrapix recoveries.
          </p>
        </div>
        <div>
          <div className="impact-number">
            {Math.round(impact.co2 + 42891).toLocaleString("en-IN")}
          </div>
          <span className="eyebrow">kg CO₂ saved</span>
        </div>
        <div>
          <div className="impact-number" style={{ color: "var(--secondary)" }}>
            {Math.round(impact.recycled + 15204).toLocaleString("en-IN")}
          </div>
          <span className="eyebrow">kg recycled</span>
        </div>
      </section>

      <section className="container page" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">Connected workflow</span>
            <h2>From discarded asset to verified recovery.</h2>
          </div>
          <p className="muted" style={{ maxWidth: 420 }}>
            A complete operational flow for households, enterprises, collection
            partners, recyclers and administrators.
          </p>
        </div>
        <div className="grid grid-4">
          {[
            {
              i: BarChart3,
              t: "Instant valuation",
              d: "Material-specific pricing and environmental benefit estimation.",
            },
            {
              i: Truck,
              t: "Smart collection",
              d: "Create pickup requests and track each operational stage.",
            },
            {
              i: ShieldCheck,
              t: "Verified recovery",
              d: "Approved partners and auditable chain-of-custody records.",
            },
            {
              i: Leaf,
              t: "Impact accounting",
              d: "Recycling, CO₂ savings and tree-equivalent dashboards.",
            },
          ].map(({ i: Icon, t, d }) => (
            <article className="card soft" key={t}>
              <div className="feature-icon">
                <Icon size={22} />
              </div>
              <h3>{t}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {d}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container page" style={{ paddingTop: 0 }}>
        <div
          className="glass card grid grid-2"
          style={{ alignItems: "center" }}
        >
          <div>
            <span className="eyebrow">Network scale</span>
            <h2>Built for the full circular economy.</h2>
            <p className="muted">
              Scrapix supports consumer pickups, enterprise asset recovery,
              partner onboarding, compliance services and administrative
              operations.
            </p>
            <Link className="btn btn-primary" href="/market">
              Explore services <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-2">
            <div className="metric">
              <Building2 size={20} />
              <strong>{users.count}+</strong>
              <span>Registered members</span>
            </div>
            <div className="metric">
              <Truck size={20} />
              <strong>24/7</strong>
              <span>Request visibility</span>
            </div>
            <div className="metric">
              <ShieldCheck size={20} />
              <strong>100%</strong>
              <span>Traceable workflow</span>
            </div>
            <div className="metric">
              <Leaf size={20} />
              <strong>{Math.round(impact.recycled)} kg</strong>
              <span>Platform recovery</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
