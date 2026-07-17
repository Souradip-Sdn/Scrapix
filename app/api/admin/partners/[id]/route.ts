import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { partnerDecisionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(["admin"]);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = await context.params;
    const profileId = Number(id);
    const input = partnerDecisionSchema.parse(await request.json());
    const [profile] = (await db`
      SELECT id, user_id, business_name FROM partner_profiles WHERE id = ${profileId}
    `) as unknown as { id: number; user_id: number; business_name: string }[];
    if (!profile)
      return NextResponse.json(
        { error: "Partner application not found" },
        { status: 404 },
      );
    await db.begin(async (sql) => {
      await sql`
        UPDATE partner_profiles 
        SET status = ${input.status}, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ${profileId}
      `;
      if (input.status === "approved") {
        await sql`UPDATE users SET role = 'partner' WHERE id = ${profile.user_id}`;
      }
      await sql`
        INSERT INTO notifications (user_id, title, message) 
        VALUES (${profile.user_id}, ${`Partner application ${input.status}`}, ${`${profile.business_name} has been ${input.status}.`})
      `;
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to review partner",
      },
      { status: 400 },
    );
  }
}
