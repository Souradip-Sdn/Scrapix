import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import type { SessionUser } from "@/lib/types";

export async function POST(request: Request) {
  // 1. Parse & validate request body
  let body: { email: string; password: string };
  try {
    body = loginSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof ZodError
        ? err.issues.map((e) => e.message).join(", ")
        : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 2. Query the database
  let row: (SessionUser & { password_hash: string }) | undefined;
  try {
    const rows = (await db`
      SELECT id, name, email, role, password_hash FROM users WHERE email = ${body.email}
    `) as unknown as (SessionUser & { password_hash: string })[];
    row = rows[0];
  } catch (err) {
    console.error("Login DB error:", err);
    return NextResponse.json(
      { error: "Database is currently unavailable. Please try again later." },
      { status: 503 },
    );
  }

  // 3. Verify credentials
  if (!row || !bcrypt.compareSync(body.password, row.password_hash)) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  // 4. Create session
  try {
    await createSession({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    });
  } catch (err) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { error: "Failed to create session. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    user: { id: row.id, name: row.name, email: row.email, role: row.role },
  });
}
