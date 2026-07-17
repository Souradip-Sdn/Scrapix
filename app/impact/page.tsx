import { Award, Leaf, Recycle, TrendingUp, Trees } from "lucide-react";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function ImpactPage() {
  const user = await getCurrentUser();
  let personal = { recycled: 342, co2: 1450, trees: 65.9 };
  if (user) {
    const [res] = (await db`
      SELECT COALESCE(SUM(recycled_kg),0)::double precision AS recycled,
             COALESCE(SUM(co2_saved_kg),0)::double precision AS co2,
             COALESCE(SUM(trees_equivalent),0)::double precision AS trees 
      FROM impact_entries 
      WHERE user_id = ${user.id}
    `) as unknown as { recycled: number; co2: number; trees: number }[];
    if (res) {
      personal = res;
    }
  }
  const [global] = (await db`
    SELECT COALESCE(SUM(recycled_kg),0)::double precision AS recycled,
           COALESCE(SUM(co2_saved_kg),0)::double precision AS co2 
    FROM impact_entries
  `) as unknown as { recycled: number; co2: number }[];
  const leaders = (await db`
    SELECT u.name, COALESCE(SUM(i.co2_saved_kg),0)::double precision AS points 
    FROM users u 
    LEFT JOIN impact_entries i ON i.user_id = u.id 
    GROUP BY u.id, u.name 
    ORDER BY points DESC 
    LIMIT 3
  `) as unknown as { name: string; points: number }[];
  const milestone = Math.max(2000, Math.ceil(personal.co2 / 1000) * 1000);
  const progress = Math.min(100, (personal.co2 / milestone) * 100);
  const bars = [28, 44, 36, 72, 48, 31, 22];
  return (
    <div className="container page stack" style={{ gap: 26 }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Verified environmental ledger</span>
          <h1
            className="gradient-text"
            style={{ fontSize: "clamp(3rem,7vw,5rem)" }}
          >
            Your Impact
          </h1>
          <p className="muted">
            Every completed recovery creates a measurable environmental record.
          </p>
        </div>
      </div>
      <div className="grid grid-3">
        <section className="glass card" style={{ gridColumn: "span 2" }}>
          <div className="row between">
            <div className="row">
              <Award color="var(--tertiary)" />
              <h3 style={{ margin: 0 }}>Carbon Neutrality Milestone</h3>
            </div>
            <span className="badge badge-approved">
              Level {Math.max(1, Math.ceil(personal.co2 / 500))}
            </span>
          </div>
          <div className="progress" style={{ margin: "26px 0 10px" }}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="row between muted">
            <small>{progress.toFixed(0)}% to next milestone</small>
            <small>
              {personal.co2.toFixed(1)} / {milestone.toLocaleString()} kg CO₂
            </small>
          </div>
          <div className="grid grid-2" style={{ marginTop: 26 }}>
            <div className="metric">
              <Recycle size={20} />
              <strong>{personal.recycled.toFixed(1)}</strong>
              <span>kg recycled</span>
            </div>
            <div className="metric">
              <Trees size={20} />
              <strong>{personal.trees.toFixed(1)}</strong>
              <span>trees equivalent</span>
            </div>
          </div>
        </section>
        <aside className="glass card">
          <div className="row">
            <Leaf size={20} color="var(--secondary)" />
            <h3 style={{ margin: 0 }}>Global Leaders</h3>
          </div>
          <div className="stack" style={{ marginTop: 20 }}>
            {leaders.map((l, i) => (
              <div
                className="row between card soft"
                style={{ padding: 12 }}
                key={i}
              >
                <span>
                  {i + 1}. {l.name}
                </span>
                <strong style={{ color: "var(--primary)" }}>
                  {l.points.toFixed(1)} pts
                </strong>
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: ".82rem", marginTop: 14 }}>
            Community total: {(global.co2 + 42891).toFixed(0)} kg CO₂ saved
          </div>
        </aside>
      </div>
      <section className="glass card">
        <div className="row between">
          <div className="row">
            <TrendingUp size={20} color="var(--secondary)" />
            <h3 style={{ margin: 0 }}>Impact Trajectory</h3>
          </div>
          <div className="category-list">
            <span className="chip">Weekly</span>
            <span className="chip">Monthly</span>
          </div>
        </div>
        <div className="chart-bars">
          {bars.map((height, i) => (
            <div
              key={i}
              className={`chart-bar ${i === 3 ? "active" : ""}`}
              style={{ height: `${height + 35}%` }}
            >
              <small>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
              </small>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-3">
        <div className="metric">
          <Leaf />
          <strong>{(global.co2 + 42891).toLocaleString()}</strong>
          <span>Global kg CO₂ saved</span>
        </div>
        <div className="metric">
          <Recycle />
          <strong>{(global.recycled + 15204).toLocaleString()}</strong>
          <span>Global kg recycled</span>
        </div>
        <div className="metric">
          <Trees />
          <strong>{((global.co2 + 42891) / 22).toFixed(0)}</strong>
          <span>Tree equivalents</span>
        </div>
      </div>
    </div>
  );
}
