import db from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PickupForm } from "@/components/forms/pickup-form";
export const dynamic = "force-dynamic";
export default async function RequestPickupPage() {
  await requireUser();
  const materialRows = (await db`
    SELECT id,name,rate_per_kg FROM materials WHERE active=1 ORDER BY name
  `) as unknown as { id: number; name: string; rate_per_kg: number }[];
  const materials = materialRows.map((row) => ({ ...row }));
  return (
    <div className="page-narrow">
      <span className="eyebrow">Collection request</span>
      <h2>Schedule verified pickup.</h2>
      <p className="muted">
        Enter an indicative weight and preferred date. The operations team can
        adjust the final value after inspection.
      </p>
      <PickupForm materials={materials} />
    </div>
  );
}
