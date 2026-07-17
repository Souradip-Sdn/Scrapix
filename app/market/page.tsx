import db from "@/lib/db";
import { MarketDirectory } from "@/components/market-directory";
export const dynamic = "force-dynamic";
export default async function MarketPage() {
  const serviceRows = (await db`
    SELECT * FROM services WHERE active=1 ORDER BY featured DESC,id
  `) as unknown as {
    id: number;
    name: string;
    description: string;
    category: string;
    pricing_model: string;
    price: number;
    unit: string;
    featured: number;
  }[];
  const services = serviceRows.map((row) => ({ ...row }));
  return (
    <div className="container page">
      <div
        style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 46px" }}
      >
        <span className="eyebrow">Transparent ecological services</span>
        <h1
          className="gradient-text"
          style={{ fontSize: "clamp(3rem,7vw,5rem)" }}
        >
          Services & Rates
        </h1>
        <p className="muted">
          Explore ecological data, compliance, collection, recovery and
          sustainability services with clear pricing.
        </p>
      </div>
      <MarketDirectory services={services} />
    </div>
  );
}
