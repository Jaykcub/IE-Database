"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { INGALLS_PASCAGOULA_WORK_CENTERS } from "@/lib/ingalls-work-centers";
import {
  DISCLAIMER,
  ESCALATION_ROUTING,
  OPERATIONS_SUMMARY,
} from "@/lib/yard-escalation";
import { buildDemoJobsForWorkCenter } from "@/lib/demo-work-orders";
import HiiWorkOrderSheet from "./HiiWorkOrderSheet";

function fmtHull(ship) {
  if (!ship) return "—";
  return `${ship.shipClass} ${ship.hullNumber}`;
}

function sessionDuration(s) {
  const a = new Date(s.startedAt).getTime();
  const b = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
  return Math.max(0, (b - a) / 3600000);
}

function trunc(s, n) {
  if (!s) return "—";
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

export default function JobsWorkspace() {
  const [tab, setTab] = useState("queue");
  const [users, setUsers] = useState([]);
  const [actor, setActor] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [callQueue, setCallQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shipFilter, setShipFilter] = useState("");
  const [workCenterKey, setWorkCenterKey] = useState("");
  const [selected, setSelected] = useState(null);
  const [assistMsg, setAssistMsg] = useState("");
  const [cbCat, setCbCat] = useState("ENGINEERING");
  const [cbDesc, setCbDesc] = useState("");
  const [foremanNote, setForemanNote] = useState("");
  const [engBody, setEngBody] = useState({ response: "", resolution: "" });
  const [msg, setMsg] = useState("");
  const [detailTab, setDetailTab] = useState("document");

  const loadActor = useCallback(async () => {
    const r = await fetch("/api/session", { credentials: "include" });
    const d = await r.json();
    setActor(d.user ?? null);
  }, []);

  const loadUsers = useCallback(async () => {
    const r = await fetch("/api/users", { credentials: "include" });
    const d = await r.json();
    if (Array.isArray(d)) setUsers(d);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === workCenterKey);
      const qs = new URLSearchParams();
      qs.set("tab", tab === "archive" ? "archive" : "queue");
      if (wc) qs.set("workCenter", wc.name);
      if (shipFilter) {
        const [cls, ...rest] = shipFilter.split(/\s+/);
        const hull = rest.join(" ");
        if (cls && hull) qs.set("ship", `${cls} ${hull}`);
      }
      const r = await fetch(`/api/jobs?${qs}`, { credentials: "include" });
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [tab, workCenterKey, shipFilter]);

  const loadInbox = useCallback(async () => {
    try {
      const r = await fetch("/api/assistance/inbox", { credentials: "include" });
      const d = await r.json();
      setInbox(Array.isArray(d.requests) ? d.requests : []);
    } catch {
      setInbox([]);
    }
  }, []);

  const loadCallBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/call-board/queue", { credentials: "include" });
      const d = await r.json();
      setCallQueue(Array.isArray(d.entries) ? d.entries : []);
    } catch {
      setCallQueue([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadActor();
  }, [loadUsers, loadActor]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (tab === "foreman") loadInbox();
    if (tab === "engineering") loadCallBoard();
  }, [tab, loadInbox, loadCallBoard]);

  async function setIdentity(userId) {
    await fetch("/api/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadActor();
    setMsg("");
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      if (!q) return true;
      const blob = `${j.woNumber} ${j.jobDescription} ${j.department} ${fmtHull(j.ship)} ${j.phase ?? ""} ${j.buildContext ?? ""} ${j.workPackageCode ?? ""} ${j.drawingRef ?? ""} ${j.zone ?? ""} ${j.scheduleCode ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [jobs, search]);

  /** When a work center is selected and the API returns no rows, show generic demo WOs. */
  const tableRows = useMemo(() => {
    const showDemo =
      workCenterKey &&
      tab === "queue" &&
      filtered.length === 0 &&
      !search.trim() &&
      jobs.length === 0;
    if (showDemo) return buildDemoJobsForWorkCenter(workCenterKey);
    return filtered;
  }, [filtered, workCenterKey, tab, search, jobs.length]);

  const shipOptions = useMemo(() => {
    const keys = new Set(jobs.map((j) => fmtHull(j.ship)));
    return Array.from(keys).sort();
  }, [jobs]);

  async function postJobAction(path) {
    if (!selected || selected.isDemo) {
      setMsg("Clock actions apply to database jobs — seed the DB or pick a non-demo row.");
      return;
    }
    setMsg("");
    const r = await fetch(`/api/jobs/${selected.id}/${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Action failed");
      return;
    }
    await loadJobs();
    if (selected?.id) {
      const nr = await fetch(`/api/jobs/${selected.id}`, { credentials: "include" });
      const nj = await nr.json();
      if (nj.id) setSelected(nj);
    }
  }

  async function submitAssistance() {
    if (!selected || !assistMsg.trim()) return;
    if (selected.isDemo) {
      setMsg("Demo work order — seed the database to request foreman assistance.");
      return;
    }
    const r = await fetch(`/api/jobs/${selected.id}/assistance`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: assistMsg }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setMsg(d.error || "Could not send");
    else {
      setAssistMsg("");
      setMsg("Assistance request sent to shop foreman queue.");
      await loadJobs();
      const nr = await fetch(`/api/jobs/${selected.id}`, { credentials: "include" });
      setSelected(await nr.json());
    }
  }

  async function submitCallBoard() {
    if (!selected || !cbDesc.trim()) return;
    if (selected.isDemo) {
      setMsg("Demo work order — seed the database to post to engineering.");
      return;
    }
    const r = await fetch(`/api/jobs/${selected.id}/call-board`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cbCat, description: cbDesc }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setMsg(d.error || "Could not escalate");
    else {
      setCbDesc("");
      setMsg("Posted to engineering call board.");
      await loadJobs();
      loadCallBoard();
      const nr = await fetch(`/api/jobs/${selected.id}`, { credentials: "include" });
      setSelected(await nr.json());
    }
  }

  async function resolveAssistance(id) {
    const r = await fetch(`/api/assistance/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "RESOLVED",
        foremanNote: foremanNote || "Acknowledged — on site.",
      }),
    });
    if (r.ok) {
      setForemanNote("");
      loadInbox();
      loadJobs();
    }
  }

  async function resolveCallEntry(id) {
    const r = await fetch(`/api/call-board/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "CLOSED",
        engineerResponse: engBody.response,
        resolutionNote: engBody.resolution,
      }),
    });
    if (r.ok) {
      setEngBody({ response: "", resolution: "" });
      loadCallBoard();
      loadJobs();
    }
  }

  const activeSessionForActor =
    actor &&
    selected?.workSessions?.find((s) => s.userId === actor.id && !s.endedAt);

  return (
    <div className="page-container animate-fade-in jobs-page">
      <header className="jobs-hero">
        <div>
          <p className="jobs-kicker">Primary operations console</p>
          <h1 className="jobs-title">Work orders &amp; execution</h1>
          <p className="jobs-lede">
            Hull-specific build packages, clock-in/out, foreman assistance queue,
            engineering call board, and archives — tie your actions to a yard
            identity below.
          </p>
        </div>
      </header>

      <section className="glass-panel jobs-identity">
        <div className="jobs-identity-row">
          <div>
            <span className="jobs-wc-label">Yard identity (demo role-play)</span>
            <p className="jobs-identity-hint">
              Technicians clock work; foremen see assistance for their shop;
              engineers close call-board items.
            </p>
          </div>
          <select
            className="form-control jobs-identity-select"
            value={actor?.id ?? ""}
            onChange={(e) => setIdentity(parseInt(e.target.value, 10))}
          >
            <option value="">Select who is at the terminal…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
                {u.departmentScope ? ` (${u.departmentScope})` : ""}
              </option>
            ))}
          </select>
        </div>
        {actor ? (
          <p className="jobs-identity-active">
            Acting as <strong>{actor.name}</strong> ({actor.role}
            {actor.departmentScope ? ` · ${actor.departmentScope}` : ""})
          </p>
        ) : (
          <p className="jobs-identity-warn">
            Choose an identity to clock work or resolve queue items.
          </p>
        )}
      </section>

      <div className="jobs-main-tabs">
        {[
          ["queue", "Active queue"],
          ["archive", "Job archive"],
          ["foreman", "Foreman assistance"],
          ["engineering", "Engineering board"],
          ["yard", "Yard toolkit"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`jobs-main-tab ${tab === k ? "jobs-main-tab--on" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? (
        <div className="jobs-banner" role="status">
          {msg}
        </div>
      ) : null}

      {tab === "foreman" ? (
        <section className="glass-panel jobs-inbox">
          <h2 className="jobs-section-title">Foreman assistance inbox</h2>
          <p className="jobs-muted">
            Open requests from technicians in{" "}
            <strong>{actor?.departmentScope || "your shops (admin sees all)"}</strong>.
          </p>
          {inbox.length === 0 ? (
            <p className="jobs-muted">No pending requests.</p>
          ) : (
            <ul className="jobs-inbox-list">
              {inbox.map((a) => (
                <li key={a.id} className="jobs-inbox-item">
                  <div>
                    <span className="jobs-mono">{a.job?.woNumber}</span> ·{" "}
                    {fmtHull(a.job?.ship)} — {a.job?.department}
                  </div>
                  <div className="jobs-inbox-msg">{a.message}</div>
                  <div className="jobs-inbox-meta">
                    From {a.fromUser?.name}{" "}
                    <button
                      type="button"
                      className="jobs-detail-btn"
                      onClick={() => resolveAssistance(a.id)}
                    >
                      Acknowledge &amp; resolve
                    </button>
                  </div>
                  <input
                    className="form-control"
                    placeholder="Foreman note (optional)"
                    value={foremanNote}
                    onChange={(e) => setForemanNote(e.target.value)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "engineering" ? (
        <section className="glass-panel jobs-inbox">
          <h2 className="jobs-section-title">Engineering / IE call board</h2>
          <p className="jobs-muted">
            Close items after disposition (drawing revision, EC, or on-site assist).
          </p>
          {callQueue.length === 0 ? (
            <p className="jobs-muted">No open engineering holds.</p>
          ) : (
            <ul className="jobs-inbox-list">
              {callQueue.map((e) => (
                <li key={e.id} className="jobs-inbox-item">
                  <div>
                    <span className="jobs-mono">{e.job?.woNumber}</span> ·{" "}
                    {e.category} · {fmtHull(e.job?.ship)}
                  </div>
                  <div className="jobs-inbox-msg">{e.description}</div>
                  <textarea
                    className="form-control"
                    placeholder="Engineer / IE response"
                    value={engBody.response}
                    onChange={(ev) =>
                      setEngBody((s) => ({ ...s, response: ev.target.value }))
                    }
                    rows={2}
                  />
                  <textarea
                    className="form-control"
                    placeholder="Resolution notes"
                    value={engBody.resolution}
                    onChange={(ev) =>
                      setEngBody((s) => ({ ...s, resolution: ev.target.value }))
                    }
                    rows={2}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => resolveCallEntry(e.id)}
                  >
                    Close call
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "yard" ? (
        <section className="glass-panel jobs-toolkit">
          <h2 className="jobs-section-title">Yard toolkit — Pascagoula-style coordination</h2>
          <p className="jobs-muted jobs-toolkit-disclaimer">{DISCLAIMER}</p>

          <h3 className="jobs-subhead">{OPERATIONS_SUMMARY.title}</h3>
          <ul className="jobs-toolkit-list">
            {OPERATIONS_SUMMARY.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <h3 className="jobs-subhead">Who to call first (Hullboard mapping)</h3>
          <div className="jobs-table-wrap jobs-escalation-wrap">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Situation</th>
                  <th>First response</th>
                  <th>Escalate</th>
                </tr>
              </thead>
              <tbody>
                {ESCALATION_ROUTING.map((row) => (
                  <tr key={row.situation}>
                    <td>{row.situation}</td>
                    <td>{row.firstCall}</td>
                    <td>{row.escalate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="jobs-subhead">Product hooks (demo)</h3>
          <ul className="jobs-toolkit-list">
            <li>
              <strong>Earned vs planned hours</strong> — work sessions on each WO roll
              up to hull and program metrics.
            </li>
            <li>
              <strong>Material readiness</strong> — placeholder for ERP; tie ECNs to
              jobs when connected.
            </li>
            <li>
              <strong>Constraint log</strong> — Foreman assistance and Engineering
              board capture why work slipped (skills, drawing, material).
            </li>
            <li>
              <strong>Quality chain</strong> — sign-off and timestamps on completed
              jobs for audit trail.
            </li>
          </ul>
        </section>
      ) : null}

      {(tab === "queue" || tab === "archive") && (
        <>
          <section className="jobs-filters glass-panel">
            <div className="jobs-filter-row">
              <label className="jobs-field">
                <span>Search</span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="WO#, description, hull, phase…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label className="jobs-field jobs-field--narrow">
                <span>Hull</span>
                <select
                  className="form-control"
                  value={shipFilter}
                  onChange={(e) => setShipFilter(e.target.value)}
                >
                  <option value="">All hulls in view</option>
                  {shipOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="jobs-wc-block">
              <span className="jobs-wc-label">Work center</span>
              <div className="jobs-chips">
                <button
                  type="button"
                  className={`jobs-chip ${workCenterKey === "" ? "jobs-chip--on" : ""}`}
                  onClick={() => setWorkCenterKey("")}
                >
                  All centers
                </button>
                {INGALLS_PASCAGOULA_WORK_CENTERS.map((wc) => (
                  <button
                    key={wc.code}
                    type="button"
                    title={wc.summary}
                    className={`jobs-chip ${workCenterKey === wc.code ? "jobs-chip--on" : ""}`}
                    onClick={() => setWorkCenterKey(wc.code)}
                  >
                    <span className="jobs-chip-code">{wc.code}</span>
                    <span className="jobs-chip-name">{wc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="jobs-table-wrap glass-panel">
            {loading ? (
              <div className="jobs-loading">Loading work orders…</div>
            ) : (
              <>
                {tableRows[0]?.isDemo ? (
                  <p className="jobs-demo-banner" role="note">
                    Showing illustrative generic work orders for{" "}
                    <strong>{workCenterKey}</strong> — seed the database for live hull
                    data. Document view matches a typical yard routing-sheet layout (not an
                    official HII controlled form).
                  </p>
                ) : null}
              <table className="jobs-table jobs-table--dense">
                <thead>
                  <tr>
                    <th>WO #</th>
                    <th>Hull</th>
                    <th>Work package</th>
                    <th>Zone / location</th>
                    <th>Center</th>
                    <th>Phase</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((job) => (
                    <tr key={job.id ?? job.woNumber}>
                      <td className="jobs-mono">{job.woNumber}</td>
                      <td>{fmtHull(job.ship)}</td>
                      <td className="jobs-cell-muted" title={job.workPackageCode ?? ""}>
                        {trunc(job.workPackageCode ?? "—", 28)}
                      </td>
                      <td className="jobs-cell-muted" title={job.zone ?? ""}>
                        {trunc(job.zone ?? "—", 36)}
                      </td>
                      <td>{job.department}</td>
                      <td>{job.phase ?? "—"}</td>
                      <td>
                        <span
                          className={`jobs-pill jobs-pill--${job.status === "COMPLETED" ? "done" : job.status === "CALL_BOARD" ? "call" : "open"}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="jobs-detail-btn"
                          onClick={() => {
                            setDetailTab("document");
                            setSelected(job);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="jobs-empty">
                        No rows in this view. If the database is empty: set{" "}
                        <code className="jobs-code">DATABASE_URL</code>, run{" "}
                        <code className="jobs-code">pnpm db:push</code> then{" "}
                        <code className="jobs-code">pnpm db:seed</code>. Otherwise clear
                        hull filters or choose a different work center.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              </>
            )}
          </section>
        </>
      )}

      {selected ? (
        <div className="jobs-modal-backdrop" role="dialog" aria-modal="true">
          <div className="jobs-modal glass-panel jobs-modal--wide jobs-modal--detail">
            <button
              type="button"
              className="jobs-modal-x"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="jobs-modal-heading">
              <div>
                <h2 className="jobs-modal-title">{selected.woNumber}</h2>
                <p className="jobs-modal-sub">
                  {fmtHull(selected.ship)}
                  {selected.ship?.displayLabel ? ` · ${selected.ship.displayLabel}` : ""}
                </p>
                {selected.isDemo ? (
                  <p className="jobs-demo-inline">
                    Demo row — use Hullboard actions only after seeding live jobs.
                  </p>
                ) : null}
              </div>
              <nav className="jobs-detail-tabs" aria-label="Work order sections">
                <button
                  type="button"
                  className={`jobs-detail-tab ${detailTab === "document" ? "jobs-detail-tab--on" : ""}`}
                  onClick={() => setDetailTab("document")}
                >
                  Work order
                </button>
                <button
                  type="button"
                  className={`jobs-detail-tab ${detailTab === "execute" ? "jobs-detail-tab--on" : ""}`}
                  onClick={() => setDetailTab("execute")}
                >
                  Hullboard actions
                </button>
              </nav>
            </div>

            {detailTab === "document" ? (
              <div className="jobs-modal-sheet">
                <HiiWorkOrderSheet job={selected} />
              </div>
            ) : (
              <>
                <p className="jobs-detail-desc">{selected.jobDescription}</p>
                {(selected.workPackageCode ||
                  selected.drawingRef ||
                  selected.zone ||
                  selected.scheduleCode) ? (
                  <dl className="jobs-routing-grid">
                    {selected.workPackageCode ? (
                      <>
                        <dt>Work package</dt>
                        <dd className="jobs-mono">{selected.workPackageCode}</dd>
                      </>
                    ) : null}
                    {selected.drawingRef ? (
                      <>
                        <dt>Drawing</dt>
                        <dd className="jobs-mono">{selected.drawingRef}</dd>
                      </>
                    ) : null}
                    {selected.zone ? (
                      <>
                        <dt>Zone / location</dt>
                        <dd>{selected.zone}</dd>
                      </>
                    ) : null}
                    {selected.scheduleCode ? (
                      <>
                        <dt>Schedule bucket</dt>
                        <dd className="jobs-mono">{selected.scheduleCode}</dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
                {selected.buildContext ? (
                  <p className="jobs-muted">
                    <strong>Build context:</strong> {selected.buildContext}
                  </p>
                ) : null}

                <div className="jobs-action-grid">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={
                      selected.isDemo || !actor || selected.status === "COMPLETED"
                    }
                    onClick={() => postJobAction("start")}
                  >
                    {activeSessionForActor ? "Clocked in ✓" : "Work started (clock in)"}
                  </button>
                  <button
                    type="button"
                    className="jobs-detail-btn"
                    disabled={selected.isDemo || !activeSessionForActor}
                    onClick={() => postJobAction("stop")}
                  >
                    Pause / clock out
                  </button>
                  <button
                    type="button"
                    className="jobs-detail-btn"
                    disabled={
                      selected.isDemo || !actor || selected.status === "COMPLETED"
                    }
                    onClick={() => postJobAction("complete")}
                  >
                    Complete &amp; sign off
                  </button>
                </div>

                <div className="jobs-metrics-row">
                  <div>
                    <span className="jobs-muted">Planned h</span>
                    <div className="jobs-metric-val">{selected.allocatedHours}</div>
                  </div>
                  <div>
                    <span className="jobs-muted">Recorded h (sessions)</span>
                    <div className="jobs-metric-val">
                      {selected.actualHours ?? "—"}
                    </div>
                  </div>
                  <div>
                    <span className="jobs-muted">Active session</span>
                    <div className="jobs-metric-val">
                      {activeSessionForActor
                        ? `${sessionDuration(activeSessionForActor).toFixed(2)} h`
                        : "—"}
                    </div>
                  </div>
                </div>

                <h3 className="jobs-subhead">Labor history</h3>
                <ul className="jobs-timeline">
                  {(selected.workSessions ?? []).slice(0, 10).map((s) => (
                    <li key={s.id}>
                      {s.user?.name}: {sessionDuration(s).toFixed(2)} h
                      {s.endedAt ? "" : " · live"}
                    </li>
                  ))}
                </ul>

                <h3 className="jobs-subhead">Assistance &amp; escalations</h3>
                <div className="jobs-stack">
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Message to shop foreman (pipe/electrical scope)"
                    value={assistMsg}
                    onChange={(e) => setAssistMsg(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={selected.isDemo}
                    onClick={submitAssistance}
                  >
                    Request foreman assistance
                  </button>
                </div>
                <ul className="jobs-mini-list">
                  {(selected.assistance ?? []).map((a) => (
                    <li key={a.id}>
                      <strong>{a.fromUser?.name}:</strong> {a.message}{" "}
                      <span className="jobs-muted">[{a.status}]</span>
                      {a.foremanNote ? (
                        <div className="jobs-foreman-note">
                          Foreman: {a.foremanNote}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <h3 className="jobs-subhead">Engineering call board</h3>
                <div className="jobs-stack">
                  <select
                    className="form-control"
                    value={cbCat}
                    onChange={(e) => setCbCat(e.target.value)}
                  >
                    <option value="ENGINEERING">Engineering</option>
                    <option value="MATERIAL">Material / supply</option>
                    <option value="PLANNING">Planning / travelers</option>
                  </select>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Describe technical hold / EC need"
                    value={cbDesc}
                    onChange={(e) => setCbDesc(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={selected.isDemo}
                    onClick={submitCallBoard}
                  >
                    Escalate to engineering board
                  </button>
                </div>
                <ul className="jobs-mini-list">
                  {(selected.callBoard ?? []).map((c) => (
                    <li key={c.id}>
                      <strong>{c.category}</strong> — {c.description}{" "}
                      <span className="jobs-muted">[{c.status}]</span>
                      {c.engineerResponse ? (
                        <div className="jobs-eng">
                          Engineer: {c.engineerResponse}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {selected.status === "COMPLETED" ? (
                  <div className="jobs-archive-banner">
                    <strong>Archived job</strong> — signed off by{" "}
                    {selected.signedOffBy?.name ?? "—"} at{" "}
                    {selected.completedAt
                      ? new Date(selected.completedAt).toLocaleString()
                      : "—"}
                  </div>
                ) : null}
              </>
            )}

            <button
              type="button"
              className="btn-primary jobs-modal-close"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
