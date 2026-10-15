"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Loader2, X } from "lucide-react";

interface Notification {
  id: string | number;
  title: string;
  message: string;
  created_at: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && !fetched) {
      setLoading(true);
      fetch("/api/notifications")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setNotifications(Array.isArray(data) ? data : []);
          setFetched(true);
        })
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    }
  }, [open, fetched]);

  const hasNotifications = notifications.length > 0;

  async function dismissNotification(id: string | number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  }

  async function clearAll() {
    setNotifications([]);
    await fetch("/api/notifications?clearAll=true", { method: "DELETE" });
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {fetched && hasNotifications && !open && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--danger)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            padding: 16,
            boxShadow: "var(--shadow)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.95rem" }}>Notifications</strong>
            {hasNotifications && (
              <button
                type="button"
                onClick={clearAll}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 350, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Loader2 size={20} className="spin" style={{ color: "var(--muted)", margin: "0 auto" }} />
              </div>
            ) : !hasNotifications ? (
              <div className="muted" style={{ textAlign: "center", padding: "20px 0", fontSize: "0.85rem" }}>
                You have no notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{ padding: "12px 12px 12px 12px", position: "relative" }}
                  className="card soft"
                >
                  <button
                    onClick={() => dismissNotification(n.id)}
                    type="button"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: 4,
                      borderRadius: "50%",
                      display: "flex",
                    }}
                    aria-label="Dismiss"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <X size={14} />
                  </button>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingRight: 20 }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text)" }}>{n.title}</strong>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "nowrap", alignSelf: "center" }}>
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
