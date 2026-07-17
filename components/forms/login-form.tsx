"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to sign in");
      setLoading(false);
      return;
    }
    const next = params.get("next");
    router.push(
      next && next.startsWith("/")
        ? next
        : result.user.role === "admin"
          ? "/admin"
          : "/dashboard",
    );
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="stack">
      {error && <div className="error-box">{error}</div>}
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
        />
      </div>
      <button className="btn btn-primary" disabled={loading}>
        {loading ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <LogIn size={18} />
        )}{" "}
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        New to Scrapix?{" "}
        <Link href="/register" style={{ color: "var(--primary)" }}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
