import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser, getCurrentPartner } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const partner = await getCurrentPartner();

    if (partner) {
      // Fetch partner-specific notifications (dynamic based on pickups in their city)
      const [partnerData] = await db`SELECT city FROM pickup_partners WHERE id = ${partner.id}`;
      if (!partnerData) return NextResponse.json([]);

      const [{ count: pendingCount }] = (await db`
        SELECT COUNT(*)::int as count 
        FROM pickup_requests 
        WHERE LOWER(city) = LOWER(${partnerData.city}) AND status = 'pending'
      `) as unknown as { count: number }[];
      
      const notifications = [];
      if (pendingCount > 0) {
        notifications.push({
          id: 'p1',
          title: "New Pickups Available",
          message: `There are ${pendingCount} pending pickups in ${partnerData.city}.`,
          created_at: new Date().toISOString(),
        });
      }
      return NextResponse.json(notifications);
    } 
    
    if (user) {
      if (user.role === "admin") {
        // Fetch admin-specific notifications
        const [{ count: pendingPartners }] = (await db`
          SELECT COUNT(*)::int as count FROM partner_profiles WHERE status = 'pending'
        `) as unknown as { count: number }[];

        const [{ count: pendingPickups }] = (await db`
          SELECT COUNT(*)::int as count FROM pickup_requests WHERE status = 'pending'
        `) as unknown as { count: number }[];

        const notifications = [];
        if (pendingPartners > 0) {
          notifications.push({
            id: 'a1',
            title: "Partner Approvals",
            message: `${pendingPartners} partner profiles are awaiting your review.`,
            created_at: new Date().toISOString(),
          });
        }
        if (pendingPickups > 0) {
          notifications.push({
            id: 'a2',
            title: "Pending Pickups",
            message: `${pendingPickups} pickup requests need attention.`,
            created_at: new Date().toISOString(),
          });
        }
        return NextResponse.json(notifications);
      } else {
        // Fetch user-specific notifications from DB
        const notifications = (await db`
          SELECT id, title, message, created_at 
          FROM notifications 
          WHERE user_id = ${user.id} 
          ORDER BY created_at DESC 
          LIMIT 5
        `) as unknown as { id: number; title: string; message: string; created_at: string }[];
        
        return NextResponse.json(notifications);
      }
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await db`DELETE FROM notifications WHERE user_id = ${user.id}`;
      return NextResponse.json({ success: true });
    }

    if (id && !isNaN(Number(id))) {
      await db`DELETE FROM notifications WHERE id = ${Number(id)} AND user_id = ${user.id}`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true }); // Ignore non-numeric IDs (dynamic admin/partner notifications)
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
