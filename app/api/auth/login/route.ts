import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import type { SessionUser } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const [row] = (await db`
      SELECT id, name, email, role, password_hash FROM users WHERE email = ${body.email}
    `) as unknown as (SessionUser & { password_hash: string })[];
    if (!row || !bcrypt.compareSync(body.password, row.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }
    await createSession({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    });
    return NextResponse.json({
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign in" },
      { status: 400 },
    );
  }
}
