"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setShowCurrent(false);
    setShowNew(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changePassword: true,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change password.");
      } else {
        setSuccess("Password changed successfully! Use your new password next time you log in.");
        reset();
        setOpen(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {success && <div className="success-box">{success}</div>}
        <button
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: "flex-start", gap: 7 }}
          onClick={() => { setSuccess(""); setOpen(true); }}
        >
          <KeyRound size={14} /> Change Password
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="stack"
      style={{ gap: 16 }}
    >
      {error && <div className="error-box">{error}</div>}

      {/* Current password */}
      <div className="field">
        <label htmlFor="cp-current">
          Current Password <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="cp-current"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter your current password"
            autoComplete="current-password"
            style={{ paddingRight: 42 }}
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "var(--muted)", cursor: "pointer", padding: 0,
            }}
            tabIndex={-1}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="form-grid">
        {/* New password */}
        <div className="field">
          <label htmlFor="cp-new">
            New Password <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="cp-new"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "var(--muted)", cursor: "pointer", padding: 0,
              }}
              tabIndex={-1}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm new password */}
        <div className="field">
          <label htmlFor="cp-confirm">
            Confirm New Password <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="cp-confirm"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              style={{
                paddingRight: 42,
                borderColor:
                  confirmPassword && confirmPassword !== newPassword
                    ? "var(--danger)"
                    : undefined,
              }}
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <span style={{ fontSize: "0.76rem", color: "var(--danger)" }}>
              Passwords do not match
            </span>
          )}
        </div>
      </div>

      {/* Strength hint */}
      {newPassword && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: "0.78rem",
            background:
              newPassword.length >= 12
                ? "rgba(34,197,94,0.09)"
                : newPassword.length >= 8
                ? "rgba(245,158,11,0.09)"
                : "rgba(255,142,133,0.09)",
            border:
              newPassword.length >= 12
                ? "1px solid rgba(34,197,94,0.3)"
                : newPassword.length >= 8
                ? "1px solid rgba(245,158,11,0.3)"
                : "1px solid rgba(255,142,133,0.3)",
            color: "var(--text)",
          }}
        >
          Password strength:{" "}
          <strong>
            {newPassword.length >= 12
              ? "Strong ✓"
              : newPassword.length >= 8
              ? "Acceptable"
              : "Too short"}
          </strong>
        </div>
      )}

      {/* Actions */}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />}
          {saving ? "Saving…" : "Update Password"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { reset(); setOpen(false); }}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
