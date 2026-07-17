import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { partnerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const input = partnerSchema.parse(await request.json());
    const [existing] = (await db`
      SELECT id, status FROM partner_profiles WHERE user_id = ${auth.user.id}
    `) as unknown as { id: number; status: string }[];
    if (existing?.status === "approved")
      return NextResponse.json(
        { error: "Your partner account is already approved" },
        { status: 409 },
      );
    await db.begin(async (sql) => {
      if (existing) {
        await sql`
          UPDATE partner_profiles 
          SET business_name = ${input.businessName}, 
              business_type = ${input.businessType}, 
              gst_number = ${input.gstNumber}, 
              address = ${input.address}, 
              city = ${input.city}, 
              state = ${input.state}, 
              pincode = ${input.pincode}, 
              monthly_capacity_kg = ${input.monthlyCapacityKg}, 
              service_radius_km = ${input.serviceRadiusKm}, 
              status = 'pending', 
              reviewed_at = NULL 
          WHERE user_id = ${auth.user.id}
        `;
      } else {
        await sql`
          INSERT INTO partner_profiles (user_id, business_name, business_type, gst_number, address, city, state, pincode, monthly_capacity_kg, service_radius_km)
          VALUES (${auth.user.id}, ${input.businessName}, ${input.businessType}, ${input.gstNumber}, ${input.address}, ${input.city}, ${input.state}, ${input.pincode}, ${input.monthlyCapacityKg}, ${input.serviceRadiusKm})
        `;
      }
      await sql`
        INSERT INTO notifications (user_id, title, message) 
        VALUES (${auth.user.id}, 'Partner application submitted', 'Our compliance team will review your profile shortly.')
      `;
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit partner application",
      },
      { status: 400 },
    );
  }
}
