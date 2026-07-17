import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const [exists] = await db`SELECT id FROM users WHERE email = ${body.email}`;
    if (exists)
      return NextResponse.json(
        { error: "An account already exists with this email" },
        { status: 409 },
      );
    const user = await db.begin(async (sql) => {
      const [u] = await sql`
        INSERT INTO users (name, email, phone, password_hash, role) 
        VALUES (${body.name}, ${body.email}, ${body.phone}, ${bcrypt.hashSync(body.password, 10)}, 'customer')
        RETURNING id
      `;
      if (body.customerType === "organization") {
        await sql`
          INSERT INTO organization_profiles (user_id, company_name, org_type, gst_number) 
          VALUES (${u.id}, ${body.companyName!}, ${body.orgType!}, ${body.gstNumber!})
        `;
      }
      return {
        id: Number(u.id),
        name: body.name,
        email: body.email,
        role: "customer" as const,
      };
    });
    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create account",
      },
      { status: 400 },
    );
  }
}
