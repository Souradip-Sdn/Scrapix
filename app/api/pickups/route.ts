import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { pickupSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const rows = await db`
    SELECT p.*, m.name AS material_name 
    FROM pickup_requests p 
    JOIN materials m ON m.id = p.material_id 
    WHERE p.user_id = ${auth.user.id} 
    ORDER BY p.created_at DESC
  `;
  return NextResponse.json({ pickups: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const input = pickupSchema.parse(await request.json());
    const [material] = (await db`
      SELECT id, rate_per_kg FROM materials WHERE id = ${input.materialId} AND active = 1
    `) as unknown as { id: number; rate_per_kg: number }[];
    if (!material)
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    const requestedDate = new Date(`${input.preferredDate}T00:00:00`);
    if (
      Number.isNaN(requestedDate.getTime()) ||
      requestedDate < new Date(new Date().toDateString())
    ) {
      return NextResponse.json(
        { error: "Preferred date cannot be in the past" },
        { status: 400 },
      );
    }
    const requestNo = `ECO-${Date.now().toString().slice(-8)}`;
    const estimatedValue = Number(
      (input.weightKg * material.rate_per_kg).toFixed(2),
    );
    const newId = await db.begin(async (sql) => {
      const [row] = await sql`
        INSERT INTO pickup_requests (request_no, user_id, material_id, weight_kg, estimated_value, address, city, pincode, preferred_date, notes)
        VALUES (${requestNo}, ${auth.user.id}, ${input.materialId}, ${input.weightKg}, ${estimatedValue}, ${input.address}, ${input.city}, ${input.pincode}, ${input.preferredDate}, ${input.notes})
        RETURNING id
      `;
      await sql`
        INSERT INTO notifications (user_id, title, message) 
        VALUES (${auth.user.id}, 'Pickup request received', ${`${requestNo} has been submitted and is awaiting scheduling.`})
      `;
      return Number(row.id);
    });
    return NextResponse.json(
      { id: newId, requestNo, estimatedValue },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create pickup request",
      },
      { status: 400 },
    );
  }
}
