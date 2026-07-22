"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, Truck, X } from "lucide-react";
import {
  LocationFields,
  LocationState,
  emptyLocation,
} from "@/components/admin/location-fields";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

function getValidCoordinates(location: LocationState): {
  latitude: number;
  longitude: number;
} | null {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function RegisterPickupPartnerModal({
  onClose,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [success, setSuccess] = useState<{
    tempPassword: string;
    name: string;
  } | null>(null);

  const [otpVia, setOtpVia] = useState<"email" | "sms" | "both">(
    "both",
  );

  const [location, setLocation] = useState<LocationState>(emptyLocation());

  useEffect(() => {
    setMounted(true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const coordinates = getValidCoordinates(location);

    if (!coordinates) {
      setError("Please point to the exact pickup location on the map.");
      return;
    }

    setLoading(true);

    try {
      const formData = Object.fromEntries(
        new FormData(event.currentTarget),
      );

      const payload = {
        ...formData,
        ...location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        otp_via: otpVia,
        password,
      };

      const response = await fetch("/api/admin/pickup-partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      setSuccess({
        tempPassword: result.partner.tempPassword,
        name: result.partner.name,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register pickup partner",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pickup-partner-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 999999,
        background: "rgba(8, 16, 14, 0.88)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        className="glass card"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          position: "relative",
          margin: "auto",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.55)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="icon-btn"
          aria-label="Close registration dialog"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            zIndex: 2,
          }}
        >
          <X size={18} />
        </button>

        <span className="eyebrow">Admin Action</span>

        <h3
          id="pickup-partner-dialog-title"
          style={{
            marginTop: 6,
            marginBottom: 4,
            paddingRight: 45,
          }}
        >
          Register Pickup Partner
        </h3>

        <p
          className="muted"
          style={{
            fontSize: "0.88rem",
            marginBottom: 24,
          }}
        >
          Add partner details, select the exact map location, and send the
          verification OTP.
        </p>

        {success ? (
          <div className="stack">
            <div
              className="success-box"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <CheckCircle2
                size={20}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <div>
                <strong>{success.name}</strong> has been registered
                successfully.
                <br />
                OTP has been sent. Temporary password for admin use:

                <code
                  style={{
                    display: "block",
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 8,
                    fontFamily: "monospace",
                    fontSize: "1.05rem",
                    letterSpacing: "0.1em",
                    color: "var(--primary)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {success.tempPassword}
                </code>

                <small
                  className="muted"
                  style={{
                    display: "block",
                    marginTop: 6,
                    fontSize: "0.78rem",
                  }}
                >
                  Share this securely. The partner can change it after
                  verification.
                </small>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="stack" style={{ gap: 18 }}>
            {error && <div className="error-box">{error}</div>}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="pp-name">
                  Full Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>

                <input
                  id="pp-name"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Rajesh Kumar"
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label htmlFor="pp-phone">
                  Phone Number <span style={{ color: "var(--danger)" }}>*</span>
                </label>

                <input
                  id="pp-phone"
                  name="phone"
                  type="tel"
                  required
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  placeholder="9876543210"
                  autoComplete="tel"
                />
              </div>

              <div className="field full">
                <label htmlFor="pp-email">
                  Email Address <span style={{ color: "var(--danger)" }}>*</span>
                </label>

                <input
                  id="pp-email"
                  name="email"
                  type="email"
                  required
                  placeholder="partner@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label htmlFor="pp-password">
                  Password <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="pp-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      color: "var(--muted)", cursor: "pointer", padding: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="pp-confirm-password">
                  Confirm Password <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="pp-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    style={{
                      paddingRight: 42,
                      borderColor: confirmPassword && confirmPassword !== password
                        ? "var(--danger)"
                        : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      color: "var(--muted)", cursor: "pointer", padding: 0,
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <span style={{ fontSize: "0.76rem", color: "var(--danger)" }}>
                    Passwords do not match
                  </span>
                )}
              </div>
            </div>

            <div className="field">
              <label htmlFor="pp-vehicle">Vehicle Type</label>
              <select
                id="pp-vehicle"
                name="vehicle_type"
                defaultValue="two_wheeler"
              >
                <option value="two_wheeler">Two Wheeler</option>
                <option value="three_wheeler">Three Wheeler / Auto</option>
                <option value="pickup_truck">Pickup Truck</option>
                <option value="mini_truck">Mini Truck</option>
                <option value="large_truck">Large Truck</option>
              </select>
            </div>

            <LocationFields
              idPrefix="pp-create"
              value={location}
              onChange={setLocation}
            />

            <div className="field">
              <label>Send OTP Via</label>

              <div
                className="row"
                style={{
                  marginTop: 8,
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                {(["email", "sms", "both"] as const).map((value) => (
                  <label
                    key={value}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="otp_via_radio"
                      value={value}
                      checked={otpVia === value}
                      onChange={() => setOtpVia(value)}
                    />

                    <span
                      style={{
                        color: "var(--text)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {value === "both"
                        ? "Email + SMS"
                        : value.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Truck size={18} />
              )}

              {loading ? "Registering..." : "Register & Send OTP"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
