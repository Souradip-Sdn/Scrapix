"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  Leaf,
  Truck,
  ShieldCheck,
  User,
  CalendarPlus,
  LogIn,
  LogOut,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface MobileNavProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  partner: {
    id: number;
    name: string;
    email: string;
    role: "pickup_partner";
  } | null;
  dashboardHref: string;
}

export function MobileNav({ user, partner, dashboardHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = partner?.name || user?.name || "";
  const displayRole = partner
    ? "Pickup Partner"
    : user?.role === "admin"
      ? "Administrator"
      : "EcoSync Member";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  return (
    <>
      <button
        type="button"
        className="icon-btn mobile-nav-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="mobile-nav-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer menu */}
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            {/* User / Partner badge if authenticated */}
            {(user || partner) && (
              <div className="mobile-user-card card soft">
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">{initial}</div>
                  <div>
                    <div className="mobile-user-name">{displayName}</div>
                    <div className="mobile-user-role">{displayRole}</div>
                  </div>
                </div>
                <span className="chip mobile-user-chip">
                  {partner ? "Partner" : user?.role || "Member"}
                </span>
              </div>
            )}

            {/* Navigation links */}
            <nav className="mobile-nav-links" aria-label="Mobile navigation">
              <Link
                href="/"
                className={`mobile-nav-link ${pathname === "/" ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <div className="mobile-nav-link-left">
                  <Home size={18} />
                  <span>Home</span>
                </div>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </Link>

              <Link
                href={dashboardHref}
                className={`mobile-nav-link ${pathname.startsWith(dashboardHref) ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <div className="mobile-nav-link-left">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </div>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </Link>

              <Link
                href="/impact"
                className={`mobile-nav-link ${pathname === "/impact" ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <div className="mobile-nav-link-left">
                  <Leaf size={18} />
                  <span>Live Impact</span>
                </div>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </Link>

              {/* Authenticated user additional links */}
              {user && (
                <>
                  <Link
                    href="/dashboard/request-pickup"
                    className={`mobile-nav-link ${pathname === "/dashboard/request-pickup" ? "active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="mobile-nav-link-left">
                      <CalendarPlus size={18} />
                      <span>Request Pickup</span>
                    </div>
                    <ChevronRight size={16} className="mobile-nav-arrow" />
                  </Link>

                  <Link
                    href="/dashboard/profile"
                    className={`mobile-nav-link ${pathname === "/dashboard/profile" ? "active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="mobile-nav-link-left">
                      <User size={18} />
                      <span>My Profile</span>
                    </div>
                    <ChevronRight size={16} className="mobile-nav-arrow" />
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className={`mobile-nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <div className="mobile-nav-link-left">
                        <ShieldCheck size={18} />
                        <span>Admin Console</span>
                      </div>
                      <ChevronRight size={16} className="mobile-nav-arrow" />
                    </Link>
                  )}
                </>
              )}

              {/* Partner additional links */}
              {partner && (
                <Link
                  href="/partner-portal/profile"
                  className={`mobile-nav-link ${pathname === "/partner-portal/profile" ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="mobile-nav-link-left">
                    <User size={18} />
                    <span>Partner Profile</span>
                  </div>
                  <ChevronRight size={16} className="mobile-nav-arrow" />
                </Link>
              )}

              {/* Guest links */}
              {!user && !partner && (
                <Link
                  href="/partner/login"
                  className={`mobile-nav-link ${pathname.startsWith("/partner/login") ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="mobile-nav-link-left">
                    <Truck size={18} />
                    <span>Partner Portal Login</span>
                  </div>
                  <ChevronRight size={16} className="mobile-nav-arrow" />
                </Link>
              )}
            </nav>

            {/* Bottom actions */}
            <div className="mobile-nav-footer">
              {!user && !partner ? (
                <>
                  <Link
                    href="/dashboard/request-pickup"
                    className="btn btn-primary mobile-btn-full"
                    onClick={() => setOpen(false)}
                  >
                    Schedule a Pickup
                    <ArrowRight size={16} />
                  </Link>

                  <div className="mobile-auth-grid">
                    <Link
                      href="/login"
                      className="btn btn-secondary mobile-btn-full"
                      onClick={() => setOpen(false)}
                    >
                      <LogIn size={16} /> Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="btn btn-ghost mobile-btn-full"
                      onClick={() => setOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                </>
              ) : partner ? (
                <Link
                  href="/api/partner/logout"
                  className="btn btn-ghost mobile-btn-full mobile-signout-btn"
                  onClick={() => setOpen(false)}
                >
                  <LogOut size={16} /> Sign out
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleSignOut}
                  className="btn btn-ghost mobile-btn-full mobile-signout-btn"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
