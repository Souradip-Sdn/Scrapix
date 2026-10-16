import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

// GET /api/admin/materials — list all materials with usage count
export async function GET() {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const materials = await db`
    SELECT
      m.id,
      m.name,
      m.category,
      m.rate_per_kg,
      m.co2_factor,
      m.active,
      COUNT(p.id)::int AS pickup_count
    FROM materials m
    LEFT JOIN pickup_requests p ON p.material_id = m.id
    GROUP BY m.id
    ORDER BY m.active DESC, m.category, m.name
  `;

  return NextResponse.json({ materials });
}

// POST /api/admin/materials — add new material
export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const rate_per_kg = Number(body.rate_per_kg);
    const co2_factor = Number(body.co2_factor);
    const active = body.active === false || body.active === 0 ? 0 : 1;

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (isNaN(rate_per_kg) || rate_per_kg <= 0) {
      return NextResponse.json({ error: "Rate per kg must be greater than 0" }, { status: 400 });
    }
    if (isNaN(co2_factor) || co2_factor < 0) {
      return NextResponse.json({ error: "CO₂ factor must be 0 or greater" }, { status: 400 });
    }

    // Check duplicate name
    const [existing] = await db`SELECT id FROM materials WHERE LOWER(name) = LOWER(${name})`;
    if (existing) {
      return NextResponse.json({ error: "An item type with this name already exists" }, { status: 409 });
    }

    const [created] = await db`
      INSERT INTO materials (name, category, rate_per_kg, co2_factor, active)
      VALUES (${name}, ${category}, ${rate_per_kg}, ${co2_factor}, ${active})
      RETURNING id, name, category, rate_per_kg, co2_factor, active
    `;

    return NextResponse.json({ material: { ...created, pickup_count: 0 } }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create material:", err);
    return NextResponse.json({ error: err.message || "Failed to create item type" }, { status: 500 });
  }
}
