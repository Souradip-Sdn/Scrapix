import { NextResponse } from "next/server";
import db from "@/lib/db";
import { estimateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = estimateSchema.parse(await request.json());
    const [material] = (await db`
      SELECT id, name, rate_per_kg, co2_factor FROM materials WHERE id = ${input.materialId} AND active = 1
    `) as unknown as { id: number; name: string; rate_per_kg: number; co2_factor: number }[];
    if (!material)
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    return NextResponse.json({
      material: material.name,
      estimatedValue: Number(
        (input.weightKg * material.rate_per_kg).toFixed(2),
      ),
      co2SavedKg: Number((input.weightKg * material.co2_factor).toFixed(2)),
      ratePerKg: material.rate_per_kg,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate estimate",
      },
      { status: 400 },
    );
  }
}
