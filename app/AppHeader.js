"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Anchor } from "lucide-react";

export default function AppHeader({ authed }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  if (!authed) {
    return null;
  }

  return (
    <header className="hb-header">
      <div className="hb-brand">
        <span className="hb-mark" aria-hidden>
          <Anchor size={22} strokeWidth={2.2} />
        </span>
        <div>
          <span className="hb-title">Hullboard</span>
          <span className="hb-tag">Admin · Ingalls (demo)</span>
        </div>
      </div>
      <nav className="hb-nav" aria-label="Primary">
        <Link className="hb-link" href="/jobs">
          Jobs
        </Link>
        <Link className="hb-link" href="/jobs">
          Jobs
        </Link>
        <Link className="hb-link" href="/metrics">
          Metrics
        </Link>
        <Link className="hb-link" href="/data-entry">
          Data entry
        </Link>
      </nav>
      <button type="button" className="hb-logout" onClick={logout}>
        Log out
      </button>
    </header>
  );
}
