/**
 * Client-side demo work orders when the API returns no rows for a work-center filter.
 * Shaped like API job payloads; marked isDemo — not persisted.
 */

import { INGALLS_PASCAGOULA_WORK_CENTERS } from "./ingalls-work-centers";

function refsFor(code, seq) {
  const rev = ["A", "B", "C"][seq % 3];
  return {
    workPackageCode: `WP-2026-${code}-DEMO-${String(seq).padStart(2, "0")}`,
    drawingRef: `${480 + seq}-${220 + seq}-${9900100 + seq * 211} Rev ${rev}`,
    zone: `Demo zone OB-${(seq % 4) + 1} · Fr ${100 + seq * 18}-${120 + seq * 18}`,
    scheduleCode: `LOB-${code.replace(/-/g, "").slice(0, 4)}-${seq}B`,
  };
}

const DEMO_SCOPES = {
  "PLAN-YARD": [
    "Zone turnover binder — align LOB segment with waterfront crane window and material drop.",
    "Staging verification for next outfit block; update planning yard status board.",
  ],
  "BLAST-PAINT": [
    "Tank/void abrasive to SP-10 profile; stripe coat touch per preservation index.",
    "Spark test holiday inspection prior to adjacent trade access.",
  ],
  "HULL-STEEL": [
    "Shell insert continuity — FA welding with UT sampling per structural traveler.",
    "Distortion monitor — report out-of-tolerance to planning before continuation.",
  ],
  PIPE: [
    "Fuel service loop rough-in — torque sequence and gasket control per piping spec index.",
    "Joint witness and hydro authorization prior to insulation close-out.",
  ],
  ELEC: [
    "Cableway rough-in — ANEW / ship service separation per EMI plan.",
    "Megger results and energization hold until planning release.",
  ],
  "STRUCT-OUTFIT": [
    "Magazine hatch — shell continuity and sill flatness QC hold.",
    "Fastener pattern as-built vs structural detail revision.",
  ],
  SUBASSY: [
    "Deckhouse utility spine — module alignment and borescope bore check.",
    "Pull-in cable tension log for module integration milestone.",
  ],
  "WELD-PROD": [
    "Production seam sequence — interpass temperature log and VT between layers.",
    "NDT routing prior to adjacent structural outfit.",
  ],
  "TEST-TRIALS": [
    "Trial card prerequisites — inclining experiment support and draft marks witness.",
    "Harbor trials choreography with tug — document safety brief.",
  ],
};

function scopesFor(code) {
  return DEMO_SCOPES[code] ?? DEMO_SCOPES.PIPE;
}

/**
 * @param {string} workCenterCode — e.g. PLAN-YARD
 * @returns {object[]}
 */
/** One illustrative row per shop when “All centers” + empty queue (offline / unseeded DB). */
const SHOWCASE_CODES = [
  "PLAN-YARD",
  "PIPE",
  "ELEC",
  "STRUCT-OUTFIT",
  "BLAST-PAINT",
  "HULL-STEEL",
  "SUBASSY",
  "WELD-PROD",
  "TEST-TRIALS",
];

export function buildDemoJobsAllCenters() {
  const rows = [];
  SHOWCASE_CODES.forEach((code, idx) => {
    const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === code);
    if (!wc) return;
    const seq = idx + 1;
    const desc = scopesFor(code)[0];
    const r = refsFor(code, seq);
    rows.push({
      id: `demo-showcase-${code}`,
      isDemo: true,
      woNumber: `ISB-GEN-${code}-SHW-${String(seq).padStart(2, "0")}`,
      department: wc.name,
      workCenterCode: code,
      jobDescription: desc,
      phase: "Demo band",
      buildContext: "Cross-shop showcase (not program data)",
      ...r,
      allocatedHours: 20 + seq * 6,
      actualHours: null,
      materialCost: null,
      notes:
        seq === 1
          ? "Seed your Neon database (pnpm db:push && pnpm db:seed) to replace demos."
          : null,
      status: seq % 3 === 0 ? "IN_PROGRESS" : "OPEN",
      dateCreated: new Date(Date.now() - seq * 7200000).toISOString(),
      completedAt: null,
      signedOffBy: null,
      signedOffById: null,
      ship: {
        shipClass: "DDG",
        hullNumber: 129,
        displayLabel: "DDG 129 (demo hull)",
      },
      workSessions: [],
      assistance: [],
      callBoard: [],
    });
  });
  return rows;
}

export function buildDemoJobsForWorkCenter(workCenterCode) {
  const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === workCenterCode);
  if (!wc) return [];

  const scopes = scopesFor(workCenterCode);
  const ship = {
    shipClass: "DDG",
    hullNumber: 129,
    displayLabel: "DDG 129 (demo hull)",
  };

  return scopes.map((desc, i) => {
    const seq = i + 1;
    const r = refsFor(workCenterCode, seq);
    const id = `demo-${workCenterCode}-${seq}`;
    return {
      id,
      isDemo: true,
      woNumber: `ISB-GEN-${workCenterCode}-${String(seq).padStart(3, "0")}`,
      department: wc.name,
      workCenterCode,
      jobDescription: desc,
      phase: i === 0 ? "Active band" : "Follow-on",
      buildContext: "Generic Ingalls-style demo package (not program data)",
      ...r,
      allocatedHours: 16 + seq * 8,
      actualHours: null,
      materialCost: null,
      notes: seq === 1 ? "Demo record — seed database for live jobs." : null,
      status: seq % 2 === 0 ? "IN_PROGRESS" : "OPEN",
      dateCreated: new Date(Date.now() - seq * 86400000).toISOString(),
      completedAt: null,
      signedOffBy: null,
      signedOffById: null,
      ship,
      workSessions: [],
      assistance: [],
      callBoard: [],
    };
  });
}
