import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { pickupStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = await context.params;
    const pickupId = Number(id);
    const input = pickupStatusSchema.parse(await request.json());
    const [pickup] = (await db`
      SELECT p.*, m.co2_factor 
      FROM pickup_requests p 
      JOIN materials m ON m.id = p.material_id 
      WHERE p.id = ${pickupId}
    `) as unknown as {
      id: number;
      user_id: number;
      request_no: string;
      status: string;
      weight_kg: number;
      co2_factor: number;
    }[];
    if (!pickup)
      return NextResponse.json({ error: "Pickup not found" }, { status: 404 });

    await db.begin(async (sql) => {
      await sql`
        UPDATE pickup_requests 
        SET status = ${input.status}, 
            completed_at = CASE 
              WHEN ${input.status}::text = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP) 
              ELSE completed_at 
            END 
        WHERE id = ${pickupId}
      `;
      if (input.status === "completed") {
        const co2 = Number((pickup.weight_kg * pickup.co2_factor).toFixed(2));
        await sql`
          INSERT INTO impact_entries (user_id, pickup_id, recycled_kg, co2_saved_kg, trees_equivalent) 
          VALUES (${pickup.user_id}, ${pickupId}, ${pickup.weight_kg}, ${co2}, ${Number((co2 / 22).toFixed(2))}) 
          ON CONFLICT (pickup_id) DO NOTHING
        `;
      }
      await sql`
        INSERT INTO notifications (user_id, title, message) 
        VALUES (${pickup.user_id}, 'Pickup status updated', ${`${pickup.request_no} is now ${input.status}.`})
      `;
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update pickup",
      },
      { status: 400 },
    );
  }
}
