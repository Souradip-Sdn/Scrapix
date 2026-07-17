import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  LogIn,
  Recycle,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Recycle size={22} /> Scrapix
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/impact">Impact</Link>
          <Link href="/market">Market</Link>
          <Link href="/partners/apply">Partners</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link
                className="icon-btn"
                href="/dashboard"
                aria-label="Dashboard"
              >
                <LayoutDashboard size={18} />
              </Link>
              {user.role === "admin" && (
                <Link className="icon-btn" href="/admin" aria-label="Admin">
                  <ShieldCheck size={18} />
                </Link>
              )}
              <Link
                className="icon-btn"
                href="/dashboard"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <LogoutButton />
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
