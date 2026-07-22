import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return NextResponse.json(auth, { status: auth.status });

    const user = auth.user;
    const body = await request.json();

    // 1. Password update
    if (body.changePassword) {
      const { currentPassword, newPassword } = body;
      const [dbUser] = await db`SELECT password_hash FROM users WHERE id = ${user.id}`;
      
      if (!bcrypt.compareSync(currentPassword, dbUser.password_hash)) {
        return NextResponse.json(
          { error: "Incorrect current password" },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      await db`
        UPDATE users 
        SET password_hash = ${bcrypt.hashSync(newPassword, 10)}
        WHERE id = ${user.id}
      `;
      return NextResponse.json({ success: true });
    }

    // 2. Profile & Location Update
    const { name, phone, address, city, state, pincode, latitude, longitude } = body;
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }
    if (!address || !city || !state || !pincode) {
      return NextResponse.json({ error: "Complete address is required" }, { status: 400 });
    }

    await db`
      UPDATE users 
      SET name = ${name}, 
          phone = ${phone},
          address = ${address},
          city = ${city},
          state = ${state},
          pincode = ${pincode},
          latitude = ${latitude ?? null},
          longitude = ${longitude ?? null}
      WHERE id = ${user.id}
    `;

    // Optionally update organization fields if they exist
    if (body.companyName || body.orgType || body.gstNumber) {
      await db`
        UPDATE organization_profiles
        SET company_name = COALESCE(${body.companyName ?? null}, company_name),
            org_type = COALESCE(${body.orgType ?? null}, org_type),
            gst_number = COALESCE(${body.gstNumber ?? null}, gst_number)
        WHERE user_id = ${user.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
