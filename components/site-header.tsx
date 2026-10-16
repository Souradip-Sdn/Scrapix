import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getCurrentPartner, getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import Image from "next/image";
import logo from "@/app/assets/logo.png";
import logoText from "@/app/assets/logo-text.png";

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
        <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <Image src={logo} alt="Scrapix Logo" height={38} className="brand-logo" style={{ width: 'auto' }} />
          <Image src={logoText} alt="Scrapix" height={35} className="brand-logo" style={{ width: 'auto' }} />
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
              <NotificationsDropdown />

              {partner ? (
                <Link
                  href="/api/partner/logout"
                  className="btn btn-ghost btn-sm"
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
          <ThemeToggle />
          <MobileNav
            user={user}
            partner={partner}
            dashboardHref={dashboardHref}
          />
        </div>
      </div>
    </header>
  );
}
