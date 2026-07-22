"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";

export function OtpVerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const partnerId = params.get("id") || "";
  const partnerName = params.get("name") || "Partner";
  const partnerEmail = params.get("email") || "";
  const partnerPhone = params.get("phone") || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [via, setVia] = useState<"email" | "sms">("email");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [countdown, setCountdown] = useState(60); // seconds until resend is allowed
  const [timeLeft, setTimeLeft] = useState(600);  // 10-min OTP expiry countdown

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count up resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Count down OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function handleDigitChange(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function verify() {
    const code = digits.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/partner/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, code, via }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Verification failed"); return; }
    router.push("/partner-portal");
    router.refresh();
  }

  async function resend() {
    if (countdown > 0) return;
    setResending(true);
    setResendMsg("");
    const res = await fetch("/api/partner/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, via }),
    });
    const data = await res.json();
    setResending(false);
    if (res.ok) {
      setResendMsg("New OTP sent!");
      setCountdown(60);
      setTimeLeft(600);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else {
      setResendMsg(data.error || "Failed to resend");
    }
    setTimeout(() => setResendMsg(""), 4000);
  }

  if (!partnerId) {
    return (
      <div className="error-box" style={{ textAlign: "center" }}>
        Missing partner info. Please <a href="/partner/login" style={{ color: "var(--primary)" }}>log in again</a>.
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Partner info */}
      <div style={{
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)" }}>Sending OTP to <strong style={{ color: "var(--text)" }}>{partnerName}</strong></p>
        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
          📧 {partnerEmail} &nbsp;|&nbsp; 📱 {partnerPhone}
        </p>
      </div>

      {/* OTP channel toggle */}
      <div className="field">
        <label>Verify via</label>
        <div className="row" style={{ marginTop: 8, gap: 16 }}>
          {(["email", "sms"] as const).map((v) => (
            <label key={v} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="radio" name="via" value={v} checked={via === v} onChange={() => setVia(v)} />
              <span style={{ color: "var(--text)", fontSize: "0.9rem" }}>
                {v === "email" ? "📧 Email" : "📱 SMS"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 6-digit input */}
      <div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              id={`otp-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 52, height: 60, textAlign: "center", fontSize: "1.5rem",
                fontWeight: 900, borderRadius: 14, padding: 0,
                border: `2px solid ${d ? "var(--primary)" : "var(--outline)"}`,
                background: d ? "rgba(80,255,175,0.07)" : "rgba(8,16,14,0.64)",
                color: "var(--primary-soft)",
                boxShadow: d ? "0 0 14px rgba(80,255,175,0.18)" : "none",
                transition: "all 0.15s",
              }}
            />
          ))}
        </div>

        {/* Expiry timer */}
        <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: "0.8rem", color: timeLeft < 120 ? "var(--danger)" : "var(--muted)" }}>
          {timeLeft > 0 ? `Expires in ${fmt(timeLeft)}` : "OTP expired — please resend"}
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {resendMsg && (
        <div className={resendMsg.includes("sent") ? "success-box" : "error-box"} style={{ textAlign: "center" }}>
          {resendMsg}
        </div>
      )}

      <button
        id="verify-otp-btn"
        className="btn btn-primary"
        onClick={verify}
        disabled={loading || timeLeft <= 0}
      >
        {loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}
        {loading ? "Verifying..." : "Verify & Continue"}
      </button>

      <button
        id="resend-otp-btn"
        className="btn btn-ghost btn-sm"
        onClick={resend}
        disabled={resending || countdown > 0}
        style={{ justifyContent: "center" }}
      >
        {resending ? <LoaderCircle className="spin" size={14} /> : <RefreshCw size={14} />}
        {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
      </button>

      <p className="muted" style={{ textAlign: "center", margin: 0, fontSize: "0.82rem" }}>
        Wrong account?{" "}
        <a href="/partner/login" style={{ color: "var(--primary)" }}>Back to login</a>
      </p>
    </div>
  );
}
