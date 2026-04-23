"use client";

import { useEffect, useState } from "react";
import {
  INGALLS_PASCAGOULA_WORK_CENTERS,
  workCenterLabel,
} from "@/lib/ingalls-work-centers";
import { canManageJobDocuments } from "@/lib/job-access";
import { readFileAsDataUrl } from "@/lib/browser-file-read";

export default function DataEntry() {
  const [ships, setShips] = useState([]);
  const [users, setUsers] = useState([]);
  const [actor, setActor] = useState(null);
  
  // Ship State
  const [shipClass, setShipClass] = useState('DDG');
  const [hullNumber, setHullNumber] = useState('');
  const [addingShip, setAddingShip] = useState(false);
  
  // Metric State
  const [shipId, setShipId] = useState('');
  const [metricDept, setMetricDept] = useState('Engineering');
  const [category, setCategory] = useState('Labor Hours');
  const [value, setValue] = useState('');

  // Job State
  const [jobShipId, setJobShipId] = useState('');
  const [jobDept, setJobDept] = useState(
    workCenterLabel(INGALLS_PASCAGOULA_WORK_CENTERS[0]),
  );
  const [jobDesc, setJobDesc] = useState('');
  const [jobAlloc, setJobAlloc] = useState('');
  const [jobActual, setJobActual] = useState('');
  const [jobCost, setJobCost] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [jobWp, setJobWp] = useState('');
  const [jobDrawing, setJobDrawing] = useState('');
  const [jobZone, setJobZone] = useState('');
  const [jobSchedule, setJobSchedule] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [jobFiles, setJobFiles] = useState([]);

  useEffect(() => {
    fetch("/api/ships", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShips(data);
        else console.error("Failed to load ships:", data);
      })
      .catch(console.error);
    fetch("/api/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
    fetch("/api/session", { credentials: "include" })
      .then((res) => res.json())
      .then((d) => setActor(d.user ?? null))
      .catch(() => setActor(null));
  }, []);

  const handleAddShip = async (e) => {
    e.preventDefault();
    setAddingShip(true);
    const res = await fetch("/api/ships", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipClass, hullNumber }),
    });
    const newShip = await res.json();
    setShips([...ships, newShip]);
    setShipId(newShip.id);
    setJobShipId(newShip.id);
    setHullNumber('');
    setAddingShip(false);
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();
    await fetch("/api/metrics", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipId, department: metricDept, category, value }),
    });
    setValue('');
    alert('Metric added successfully!');
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!actor || !canManageJobDocuments(actor)) {
      alert(
        "Select an admin, IE, engineer, or planner yard identity (Hullboard header session) before creating a job package.",
      );
      return;
    }
    const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find(
      (w) => workCenterLabel(w) === jobDept,
    );
    const attachments = [];
    for (const f of jobFiles) {
      try {
        const contentBase64 = await readFileAsDataUrl(f);
        attachments.push({ fileName: f.name, contentBase64 });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not read a selected file.");
        return;
      }
    }
    const res = await fetch("/api/jobs", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipId: jobShipId,
        department: jobDept,
        workCenterCode: wc?.code ?? null,
        woNumber: `WO-MAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        jobDescription: jobDesc,
        allocatedHours: jobAlloc,
        actualHours: jobActual || undefined,
        materialCost: jobCost || undefined,
        notes: jobNotes || undefined,
        workPackageCode: jobWp || undefined,
        drawingRef: jobDrawing || undefined,
        zone: jobZone || undefined,
        scheduleCode: jobSchedule || undefined,
        requirementsText: jobRequirements.trim() || undefined,
        attachments,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(typeof data?.error === "string" ? data.error : "Job create failed.");
      return;
    }
    setJobDesc("");
    setJobAlloc("");
    setJobActual("");
    setJobCost("");
    setJobNotes("");
    setJobWp("");
    setJobDrawing("");
    setJobZone("");
    setJobSchedule("");
    setJobRequirements("");
    setJobFiles([]);
    alert("Job ticket logged successfully.");
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Data Management</h1>
      
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Create Job Ticket</h2>
          <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1rem" }}>
            Requirements and file attachments require an <strong>admin</strong>,{" "}
            <strong>IE</strong>, <strong>engineer</strong>, or <strong>planner</strong> yard
            identity (same browser session as the Jobs console). Pick one below, or set your
            identity on the{" "}
            <a href="/jobs" style={{ color: "#2563eb" }}>
              Jobs
            </a>{" "}
            page first.
          </p>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Yard identity (same session as Jobs page)</label>
            <select
              className="form-control"
              value={actor?.id ?? ""}
              onChange={async (e) => {
                const v = e.target.value;
                if (!v) {
                  await fetch("/api/session", { method: "DELETE", credentials: "include" });
                  setActor(null);
                  return;
                }
                await fetch("/api/session", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: parseInt(v, 10) }),
                });
                const r = await fetch("/api/session", { credentials: "include" });
                const d = await r.json();
                setActor(d.user ?? null);
              }}
            >
              <option value="">Not selected — pick a planner-capable user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
            {actor ? (
              <p style={{ fontSize: "0.82rem", marginTop: "0.35rem" }}>
                Acting as <strong>{actor.name}</strong> ({actor.role})
                {!canManageJobDocuments(actor) ? (
                  <span style={{ color: "#b91c1c" }}>
                    {" "}
                    — cannot author job packages; switch to admin / IE / engineer / planner.
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <form onSubmit={handleAddJob}>
            <div className="form-group">
              <label className="form-label">Target Ship</label>
              <select className="form-control" value={jobShipId} onChange={e => setJobShipId(e.target.value)} required>
                <option value="">Select a ship...</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Work center (Ingalls demo list)</label>
              <select
                className="form-control"
                value={jobDept}
                onChange={(e) => setJobDept(e.target.value)}
                required
              >
                {INGALLS_PASCAGOULA_WORK_CENTERS.map((wc) => (
                  <option key={wc.code} value={workCenterLabel(wc)}>
                    {wc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description</label>
              <input type="text" className="form-control" value={jobDesc} onChange={e => setJobDesc(e.target.value)} required placeholder="e.g. Aft bulk head welding" />
            </div>
            <div className="form-group">
              <label className="form-label">Allocated Hours</label>
              <input type="number" step="0.1" className="form-control" value={jobAlloc} onChange={e => setJobAlloc(e.target.value)} required placeholder="Target hours..." />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Hours (Optional)</label>
              <input type="number" step="0.1" className="form-control" value={jobActual} onChange={e => setJobActual(e.target.value)} placeholder="Actual hours spent..." />
            </div>
            <div className="form-group">
              <label className="form-label">Material Cost (Optional)</label>
              <input type="number" step="0.01" className="form-control" value={jobCost} onChange={e => setJobCost(e.target.value)} placeholder="Material spend..." />
            </div>
            <div className="form-group">
              <label className="form-label">Work package code (optional, demo routing)</label>
              <input type="text" className="form-control" value={jobWp} onChange={(e) => setJobWp(e.target.value)} placeholder="e.g. WP-2026-DG51-PIP-SVC-1184" />
            </div>
            <div className="form-group">
              <label className="form-label">Drawing reference (optional)</label>
              <input type="text" className="form-control" value={jobDrawing} onChange={(e) => setJobDrawing(e.target.value)} placeholder="e.g. 500-200-8811033 Rev B" />
            </div>
            <div className="form-group">
              <label className="form-label">Zone / location (optional)</label>
              <input type="text" className="form-control" value={jobZone} onChange={(e) => setJobZone(e.target.value)} placeholder="e.g. P-1, Fr 165-210, Port" />
            </div>
            <div className="form-group">
              <label className="form-label">Schedule bucket (optional)</label>
              <input type="text" className="form-control" value={jobSchedule} onChange={(e) => setJobSchedule(e.target.value)} placeholder="e.g. LOB-HULL-14B" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-control"
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                placeholder="Attach any department notes or observations here..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job requirements &amp; traveler (optional)</label>
              <textarea
                className="form-control"
                value={jobRequirements}
                onChange={(e) => setJobRequirements(e.target.value)}
                placeholder="QC gates, torque spec references, PPE, prerequisite WOs…"
                rows={5}
                style={{ resize: "vertical" }}
                disabled={!actor || !canManageJobDocuments(actor)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Attachments (PDF, images, text — max ~512 KB each)</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.doc,.docx,application/pdf,image/*"
                disabled={!actor || !canManageJobDocuments(actor)}
                onChange={(e) => setJobFiles(Array.from(e.target.files ?? []))}
              />
              {jobFiles.length ? (
                <p style={{ fontSize: "0.82rem", marginTop: "0.35rem" }}>
                  {jobFiles.length} file(s) selected
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", marginTop: "1rem" }}
              disabled={
                !jobShipId ||
                !jobDesc ||
                !jobAlloc ||
                !actor ||
                !canManageJobDocuments(actor)
              }
            >
              Submit Job Ticket
            </button>
          </form>
        </div>

        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Record Specific Metric</h2>
            <form onSubmit={handleAddMetric}>
              <div className="form-group">
                <label className="form-label">Target Ship</label>
                <select className="form-control" value={shipId} onChange={e => setShipId(e.target.value)} required>
                  <option value="">Select a ship...</option>
                  {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={metricDept} onChange={e => setMetricDept(e.target.value)} required>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Pipefitting">Pipefitting</option>
                  <option value="Welding">Welding</option>
                  <option value="Paint">Paint</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metric Category</label>
                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="Labor Hours">Labor Hours</option>
                  <option value="Cost Variance">Cost Variance</option>
                  <option value="Schedule Variance">Schedule Variance</option>
                  <option value="Defect Rate">Defect Rate</option>
                  <option value="Material Spend">Material Spend</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metric Value</label>
                <input type="number" step="0.01" className="form-control" value={value} onChange={e => setValue(e.target.value)} required placeholder="Enter numeric value..." />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!shipId || !value}>
                Submit Metric
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Register New Ship</h2>
            <form onSubmit={handleAddShip}>
              <div className="form-group">
                <label className="form-label">Ship Class</label>
                <select className="form-control" value={shipClass} onChange={e => setShipClass(e.target.value)} required>
                  <option value="DDG">DDG</option>
                  <option value="DDGX">DDGX</option>
                  <option value="LPD">LPD</option>
                  <option value="LHA">LHA</option>
                  <option value="CVN">CVN</option>
                  <option value="SSN">SSN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hull Number</label>
                <input type="number" className="form-control" value={hullNumber} onChange={e => setHullNumber(e.target.value)} required placeholder="e.g. 128" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={addingShip || !hullNumber}>
                {addingShip ? 'Registering...' : 'Register Ship'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
