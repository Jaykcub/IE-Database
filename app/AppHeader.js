"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anchor } from "lucide-react";

export default function AppHeader({ authed }) {
  const router = useRouter();
  const [actorRole, setActorRole] = useState(null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    let active = true;
    async function loadActor() {
      try {
        const r = await fetch("/api/session", { credentials: "include" });
        const d = await r.json();
        if (active) setActorRole(d?.user?.role ?? null);
      } catch {
        if (active) setActorRole(null);
      }
    }
    loadActor();
    return () => {
      active = false;
    };
  }, []);

  if (!authed) {
    return null;
  }

  const isTechnician = actorRole === "TECHNICIAN";

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
        {!isTechnician ? (
          <>
            <Link className="hb-link" href="/metrics">
              Metrics
            </Link>
            <Link className="hb-link" href="/data-entry">
              Data entry
            </Link>
          </>
        ) : null}
      </nav>
      <button type="button" className="hb-logout" onClick={logout}>
        Log out
      </button>
    </header>
  );
}
