"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { INGALLS_PASCAGOULA_WORK_CENTERS } from "@/lib/ingalls-work-centers";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shipFilter, setShipFilter] = useState("");
  const [workCenterKey, setWorkCenterKey] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === workCenterKey);
      const qs = wc ? `?workCenter=${encodeURIComponent(wc.name)}` : "";
      const res = await fetch(`/api/jobs${qs}`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
      else setJobs([]);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [workCenterKey]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const term = search.toLowerCase();
    return jobs.filter((job) => {
      const shipName =
        `${job.ship?.shipClass ?? ""} ${job.ship?.hullNumber ?? ""}`.toLowerCase();
      const matchesSearch =
        !search ||
        job.jobDescription.toLowerCase().includes(term) ||
        shipName.includes(term) ||
        (job.notes && job.notes.toLowerCase().includes(term)) ||
        (job.department && job.department.toLowerCase().includes(term));

      const shipLabel = `${job.ship?.shipClass} ${job.ship?.hullNumber}`;
      const matchesShip = !shipFilter || shipLabel === shipFilter;

      return matchesSearch && matchesShip;
    });
  }, [jobs, search, shipFilter]);

  const uniqueShips = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((j) => `${j.ship?.shipClass} ${j.ship?.hullNumber}`)),
      ),
    [jobs],
  );

  return (
    <div className="page-container animate-fade-in jobs-page">
      <header className="jobs-hero">
        <div>
          <p className="jobs-kicker">Job queue · Ingalls-style work centers</p>
          <h1 className="jobs-title">Work orders</h1>
          <p className="jobs-lede">
            Filter by hull and by Pascagoula work center (demo list aligned with
            public Ingalls operations — not an official HII master).
          </p>
        </div>
      </header>

      <section className="jobs-filters glass-panel">
        <div className="jobs-filter-row">
          <label className="jobs-field">
            <span>Search</span>
            <input
              type="search"
              className="form-control"
              placeholder="Description, hull, notes…"
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
              <option value="">All hulls</option>
              {uniqueShips.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="jobs-wc-block">
          <span className="jobs-wc-label">Work center (HII Ingalls — demo)</span>
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
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Hull</th>
                <th>Work center</th>
                <th>Description</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td className="jobs-mono">
                    {job.ship?.shipClass} {job.ship?.hullNumber}
                  </td>
                  <td>{job.department}</td>
                  <td>{job.jobDescription}</td>
                  <td>
                    <span
                      className={`jobs-pill jobs-pill--${job.status === "COMPLETED" ? "done" : "open"}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="jobs-detail-btn"
                      onClick={() => setSelectedJob(job)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="jobs-empty">
                    No jobs match these filters. Try another work center or run{" "}
                    <code className="jobs-code">pnpm db:seed</code>.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </section>

      {selectedJob ? (
        <div
          className="jobs-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-modal-title"
        >
          <div className="jobs-modal glass-panel">
            <button
              type="button"
              className="jobs-modal-x"
              onClick={() => setSelectedJob(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 id="job-modal-title" className="jobs-modal-title">
              Work order
            </h2>
            <dl className="jobs-dl">
              <div>
                <dt>Hull</dt>
                <dd className="jobs-mono">
                  {selectedJob.ship?.shipClass} {selectedJob.ship?.hullNumber}
                </dd>
              </div>
              <div>
                <dt>Work center</dt>
                <dd>{selectedJob.department}</dd>
              </div>
              <div className="jobs-dl-span">
                <dt>Description</dt>
                <dd>{selectedJob.jobDescription}</dd>
              </div>
              <div>
                <dt>Allocated h</dt>
                <dd>{selectedJob.allocatedHours}</dd>
              </div>
              <div>
                <dt>Actual h</dt>
                <dd
                  className={
                    (selectedJob.actualHours || 0) > selectedJob.allocatedHours
                      ? "jobs-warn"
                      : ""
                  }
                >
                  {selectedJob.actualHours ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>
                  {selectedJob.materialCost != null
                    ? `$${Number(selectedJob.materialCost).toLocaleString()}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedJob.status}</dd>
              </div>
              <div className="jobs-dl-span">
                <dt>Notes</dt>
                <dd className="jobs-notes">
                  {selectedJob.notes || (
                    <span className="jobs-muted">No notes.</span>
                  )}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn-primary jobs-modal-close"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
