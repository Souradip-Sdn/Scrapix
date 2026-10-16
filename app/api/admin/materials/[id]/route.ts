import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

// GET /api/admin/materials/[id] — get single material
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const materialId = Number(id);

  const [material] = await db`
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
    WHERE m.id = ${materialId}
    GROUP BY m.id
  `;

  if (!material) {
    return NextResponse.json({ error: "Item type not found" }, { status: 404 });
  }

  return NextResponse.json({ material });
}

// PATCH /api/admin/materials/[id] — update material fields or active status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const materialId = Number(id);

  const [existing] = await db`SELECT id, name, active FROM materials WHERE id = ${materialId}`;
  if (!existing) {
    return NextResponse.json({ error: "Item type not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Quick toggle active state
    if (body.toggleActive !== undefined) {
      const newActive = body.toggleActive ? 1 : 0;
      const [updated] = await db`
        UPDATE materials
        SET active = ${newActive}
        WHERE id = ${materialId}
        RETURNING id, name, category, rate_per_kg, co2_factor, active
      `;
      return NextResponse.json({ material: updated });
    }

    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const category = body.category !== undefined ? String(body.category).trim() : undefined;
    const rate_per_kg = body.rate_per_kg !== undefined ? Number(body.rate_per_kg) : undefined;
    const co2_factor = body.co2_factor !== undefined ? Number(body.co2_factor) : undefined;
    const active = body.active !== undefined ? (body.active ? 1 : 0) : undefined;

    if (name !== undefined) {
      if (!name) return NextResponse.json({ error: "Item name cannot be empty" }, { status: 400 });
      const [dup] = await db`
        SELECT id FROM materials WHERE LOWER(name) = LOWER(${name}) AND id != ${materialId}
      `;
      if (dup) {
        return NextResponse.json({ error: "Another item type already uses this name" }, { status: 409 });
      }
    }

    if (category !== undefined && !category) {
      return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
    }

    if (rate_per_kg !== undefined && (isNaN(rate_per_kg) || rate_per_kg <= 0)) {
      return NextResponse.json({ error: "Rate per kg must be greater than 0" }, { status: 400 });
    }

    if (co2_factor !== undefined && (isNaN(co2_factor) || co2_factor < 0)) {
      return NextResponse.json({ error: "CO₂ factor must be 0 or greater" }, { status: 400 });
    }

    const [updated] = await db`
      UPDATE materials
      SET
        name = COALESCE(${name ?? null}, name),
        category = COALESCE(${category ?? null}, category),
        rate_per_kg = COALESCE(${rate_per_kg ?? null}, rate_per_kg),
        co2_factor = COALESCE(${co2_factor ?? null}, co2_factor),
        active = COALESCE(${active ?? null}, active)
      WHERE id = ${materialId}
      RETURNING id, name, category, rate_per_kg, co2_factor, active
    `;

    return NextResponse.json({ material: updated });
  } catch (err: any) {
    console.error("Failed to update material:", err);
    return NextResponse.json({ error: err.message || "Failed to update item type" }, { status: 500 });
  }
}

// DELETE /api/admin/materials/[id] — delete or archive material
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const materialId = Number(id);

  const [existing] = await db`SELECT id, name FROM materials WHERE id = ${materialId}`;
  if (!existing) {
    return NextResponse.json({ error: "Item type not found" }, { status: 404 });
  }

  // Check if referenced in pickup_requests or ebills
  const [{ count: pickupCount }] = await db`
    SELECT COUNT(*)::int AS count FROM pickup_requests WHERE material_id = ${materialId}
  `;
  const [{ count: ebillCount }] = await db`
    SELECT COUNT(*)::int AS count FROM ebills WHERE material_id = ${materialId}
  `;

  if (pickupCount > 0 || ebillCount > 0) {
    // Soft delete/archive by marking active = 0 to preserve database foreign key integrity
    await db`UPDATE materials SET active = 0 WHERE id = ${materialId}`;
    return NextResponse.json({
      success: true,
      archived: true,
      message: `"${existing.name}" is linked to existing pickups or bills, so it has been archived (deactivated) from public view instead of deleting historical records.`,
    });
  }

  // If completely unreferenced, hard delete
  await db`DELETE FROM materials WHERE id = ${materialId}`;
  return NextResponse.json({
    success: true,
    deleted: true,
    message: `"${existing.name}" was permanently removed from the database.`,
  });
}
