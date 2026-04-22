"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign-in failed");
        return;
      }
      const from = searchParams.get("from");
      router.push(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-rail" aria-hidden />
      <div className="login-panel">
        <p className="login-kicker">HII Ingalls · Pascagoula (demo)</p>
        <h1 className="login-title">Hullboard</h1>
        <p className="login-sub">
          Production visibility and job routing. Sign in with the demo admin
          account.
        </p>

        <form className="login-form" onSubmit={onSubmit}>
          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}
          <label className="login-label">
            Username
            <input
              className="login-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin"
            />
          </label>
          <label className="login-label">
            Password
            <input
              className="login-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin"
            />
          </label>
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter yard"}
          </button>
        </form>
        <p className="login-hint">
          Demo credentials: <kbd>Admin</kbd> / <kbd>Admin</kbd>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-shell">
          <div className="login-panel">
            <p className="login-sub">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
