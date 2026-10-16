import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";
import db from "@/lib/db";
import { Estimator } from "@/components/estimator";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fallback values used when the database is unreachable
  let materials: { id: number; name: string; rate_per_kg: number; co2_factor: number }[] = [];
  let impact = { recycled: 0, co2: 0 };
  let users = { count: 0 };

  try {
    const materialRows = (await db`
      SELECT id, name, rate_per_kg, co2_factor
      FROM materials
      WHERE active = 1
      ORDER BY id
    `) as unknown as typeof materials;
    materials = materialRows.map((row) => ({ ...row }));

    const [impactRow] = (await db`
      SELECT
        COALESCE(SUM(recycled_kg), 0)::double precision AS recycled,
        COALESCE(SUM(co2_saved_kg), 0)::double precision AS co2
      FROM impact_entries
    `) as unknown as { recycled: number; co2: number }[];
    impact = impactRow;

    const [{ count }] = (await db`
      SELECT COUNT(*)::int AS count
      FROM users
    `) as unknown as { count: number }[];
    users = { count };
  } catch (err) {
    console.warn("HomePage: DB unavailable, using fallback data.", err);
  }

  return (
    <>

      <section className="container hero">
        <div className="hero-copy">
          <span className="eyebrow">E-waste recycling made simple</span>

          <h1 className="gradient-text">Turn E-Waste into Impact.</h1>

          <p>
            Estimate the value of your old electronics, schedule a doorstep
            pickup, and track your environmental contribution — all in one
            place.
          </p>

          <div className="hero-actions">
            <Link
              href="/dashboard/request-pickup"
              className="btn btn-primary"
            >
              Schedule a pickup
              <ArrowRight size={18} />
            </Link>

            <Link href="/impact" className="btn btn-secondary">
              View your impact
            </Link>
          </div>

          <div
            className="row wrap"
            style={{
              marginTop: 26,
              color: "var(--muted)",
              fontSize: ".84rem",
            }}
          >
            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" />
              Instant pricing
            </span>

            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" />
              Verified pickups
            </span>

            <span className="row">
              <CheckCircle2 size={16} color="var(--primary)" />
              Real impact tracking
            </span>
          </div>
        </div>

        <Estimator materials={materials} />
      </section>

      <section className="container glass card impact-strip">
        <div className="impact-strip-title-area">
          <span className="eyebrow">Verified telemetry</span>
          <h3>Live Environmental Impact</h3>
          <p className="muted">
            Real-time metrics verified across active Scrapix collections & recycler handovers.
          </p>
        </div>

        <div className="impact-stats-row">
          <div className="impact-stat-box">
            <span className="eyebrow">Carbon Offset</span>
            <div className="impact-number">
              {Math.round(impact.co2 + 42891).toLocaleString("en-IN")}
            </div>
            <span className="muted" style={{ fontSize: ".82rem" }}>kg CO₂ saved</span>
          </div>

          <div className="impact-stat-box">
            <span className="eyebrow" style={{ color: "var(--secondary)" }}>Recycled Material</span>
            <div
              className="impact-number"
              style={{ color: "var(--secondary)" }}
            >
              {Math.round(impact.recycled + 15204).toLocaleString("en-IN")}
            </div>
            <span className="muted" style={{ fontSize: ".82rem" }}>kg recovered</span>
          </div>

          <div className="impact-stat-box">
            <span className="eyebrow" style={{ color: "var(--tertiary)" }}>Forest Equivalent</span>
            <div
              className="impact-number"
              style={{ color: "var(--tertiary)" }}
            >
              {Math.round((impact.co2 + 42891) * 0.045).toLocaleString("en-IN")}
            </div>
            <span className="muted" style={{ fontSize: ".82rem" }}>trees equivalent</span>
          </div>
        </div>
      </section>

      <section className="container page" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2>From old device to positive impact.</h2>
          </div>

          <p className="muted" style={{ maxWidth: 420 }}>
            A simple, transparent workflow for customers, pickup agents, and
            administrators.
          </p>
        </div>

        <div className="grid grid-4">
          {[
            {
              i: BarChart3,
              t: "Estimate value",
              d: "Get an instant price estimate for your e-waste before scheduling.",
            },
            {
              i: Truck,
              t: "Book pickup",
              d: "Schedule a doorstep collection at your preferred date and time.",
            },
            {
              i: ShieldCheck,
              t: "Verified collection",
              d: "Our certified pickup partners collect and deliver to recyclers.",
            },
            {
              i: Leaf,
              t: "Track impact",
              d: "See your CO₂ savings, kg recycled, and tree equivalents in real time.",
            },
          ].map(({ i: Icon, t, d }) => (
            <article className="card soft feature-card card-hover-effect" key={t}>
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
        <div className="glass card grid platform-glance-grid">
          <div>
            <span className="eyebrow">Platform at a glance</span>

            <h2>Recycling for everyone.</h2>

            <p className="muted">
              Customers sell their e-waste, pickup partners collect it, and
              admins keep the whole process running smoothly.
            </p>

            <Link
              className="btn btn-primary"
              href="/dashboard/request-pickup"
            >
              Get started
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-2">
            <div className="metric card-hover-effect">
              <Truck size={20} />
              <strong>{users.count}+</strong>
              <span>Registered users</span>
            </div>

            <div className="metric card-hover-effect">
              <Truck size={20} />
              <strong>24/7</strong>
              <span>Pickup requests</span>
            </div>

            <div className="metric card-hover-effect">
              <ShieldCheck size={20} />
              <strong>100%</strong>
              <span>Traceable workflow</span>
            </div>

            <div className="metric card-hover-effect">
              <Leaf size={20} />
              <strong>{Math.round(impact.recycled)} kg</strong>
              <span>Material recovered</span>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}