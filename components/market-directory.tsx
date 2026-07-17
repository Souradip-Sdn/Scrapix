"use client";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/format";
type Service = {
  id: number;
  name: string;
  description: string;
  category: string;
  pricing_model: string;
  price: number;
  unit: string;
  featured: number;
};
export function MarketDirectory({ services }: { services: Service[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...Array.from(new Set(services.map((s) => s.category))),
  ];
  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          (category === "All" || s.category === category) &&
          `${s.name} ${s.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [services, query, category],
  );
  return (
    <div className="grid grid-3" style={{ alignItems: "start" }}>
      <aside className="glass card stack">
        <div>
          <h3>Find a Service</h3>
          <div className="field">
            <label>Search</label>
            <div style={{ position: "relative" }}>
              <Search
                size={17}
                style={{
                  position: "absolute",
                  left: 13,
                  top: 14,
                  color: "var(--muted)",
                }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services..."
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>
        </div>
        <div>
          <label>Categories</label>
          <div className="category-list" style={{ marginTop: 10 }}>
            {categories.map((c) => (
              <button
                className="chip"
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  color: category === c ? "var(--primary)" : "var(--muted)",
                  borderColor: category === c ? "var(--primary)" : undefined,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="card soft">
          <Sparkles size={20} color="var(--secondary)" />
          <h3>Volume Calculator</h3>
          <p className="muted" style={{ fontSize: ".85rem" }}>
            Need enterprise-scale collection pricing?
          </p>
          <a
            className="btn btn-primary btn-sm"
            href="mailto:enterprise@scrapix.local"
          >
            Request quote
          </a>
        </div>
      </aside>
      <section className="stack" style={{ gridColumn: "span 2" }}>
        {filtered.length ? (
          filtered.map((s) => (
            <article className="glass card service-card" key={s.id}>
              <div>
                {s.featured ? <span className="eyebrow">Featured</span> : null}
                <h3 style={{ margin: "4px 0" }}>{s.name}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {s.description}
                </p>
                <span
                  className="chip"
                  style={{ display: "inline-block", marginTop: 12 }}
                >
                  {s.category}
                </span>
              </div>
              <div>
                <div className="service-price">
                  {s.price < 1
                    ? `₹${s.price.toFixed(2)}`
                    : formatCurrency(s.price)}
                  <small>per {s.unit}</small>
                </div>
                <a
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                  href={`mailto:services@scrapix.local?subject=${encodeURIComponent(s.name)}`}
                >
                  Learn more
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="glass card empty">
            No services match the selected filters.
          </div>
        )}
      </section>
    </div>
  );
}
