import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const store = await cookies();
  store.delete("scrapix_partner_session");
  return NextResponse.redirect(new URL("/partner/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
