import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/materials — returns all active materials
export async function GET() {
  const materials = await db`
    SELECT id, name, category, rate_per_kg, co2_factor
    FROM materials
    WHERE active = 1
    ORDER BY category, name
  `;
  return NextResponse.json({ materials });
}
