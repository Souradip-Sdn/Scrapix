import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  LogIn,
  Recycle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getCurrentPartner, getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const partner = await getCurrentPartner();
  
  // Decide the primary dashboard link depending on role
  const dashboardHref = partner 
    ? "/partner-portal" 
    : user?.role === "admin"
      ? "/admin"
      : "/dashboard";
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Recycle size={22} /> Scrapix
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href={dashboardHref}>Dashboard</Link>
          <Link href="/impact">Impact</Link>
          {!partner && !user && (
            <Link href="/partner/login" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Truck size={14} /> Partner Login
            </Link>
          )}
        </nav>
        <div className="header-actions">
          {user || partner ? (
            <>
              <Link
                className="icon-btn"
                href={dashboardHref}
                aria-label="Dashboard"
              >
                <LayoutDashboard size={18} />
              </Link>
              {user?.role === "admin" && (
                <Link className="icon-btn" href="/admin" aria-label="Admin">
                  <ShieldCheck size={18} />
                </Link>
              )}
              <Link
                className="icon-btn"
                href={dashboardHref}
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              
              {partner ? (
                <Link
                  href="/api/partner/logout"
                  className="btn btn-ghost btn-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Sign out
                </Link>
              ) : (
                <LogoutButton />
              )}
            </>
          ) : (
            <Link href="/login" className="btn btn-secondary btn-sm">
              <LogIn size={16} /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
