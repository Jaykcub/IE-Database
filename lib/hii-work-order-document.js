/**
 * Illustrative shipyard work-order / routing sheet content for UI training.
 * Not an official HII form or controlled document.
 */

import { INGALLS_PASCAGOULA_WORK_CENTERS } from "./ingalls-work-centers";

export const HII_WO_DISCLAIMER =
  "Illustrative training layout only — not an official Huntington Ingalls Industries work order, traveler, or government document.";

const WC_STEPS = {
  "PLAN-YARD": [
    "Verify zone turnover package against latest line-of-balance drop.",
    "Confirm staging alignment with waterfront crane schedule window.",
    "Record kit release and drawing index revision on traveler continuation sheet.",
  ],
  "BLAST-PAINT": [
    "Surface profile per specification; document ambient conditions.",
    "Apply stripe / full coat per drawing stack; hold for holiday inspection.",
    "QC release prior to adjacent trade re-entry.",
  ],
  "HULL-STEEL": [
    "Fit-up check against nest layout; flag lamination / edge prep variances.",
    "Execute weld sequence per WPS; log interpass temperature.",
    "Submit NDT routing slip for hold witness points.",
  ],
  PIPE: [
    "Verify material heat numbers and gasket kit against BOM.",
    "Torque sequence per drawing; joint witness as noted.",
    "Hydro / leak test authorization prior to insulation / lagging close-out.",
  ],
  ELEC: [
    "Pull sheet vs cable schedule reconciliation; EMI boundary markers installed.",
    "Megger / continuity results logged before energization request.",
    "Tag-out coordination with ship service trials schedule.",
  ],
  "STRUCT-OUTFIT": [
    "Shell continuity / seal interface per structural detail.",
    "Fastener pattern and torque map as-installed sign-off.",
    "Coating touch-up and final protective measures before turnover.",
  ],
  SUBASSY: [
    "Module alignment pins and interface tolerances per integration plan.",
    "Utility rough-in conflicts resolved with planning before lift.",
    "Weight / CG tag verified for crane pick.",
  ],
  "WELD-PROD": [
    "Joint preparation and fit-up inspection prior to arc time.",
    "Layer sequence and PWHT requirements per WPS.",
    "Visual / NDT disposition prior to adjacent hot work.",
  ],
  "TEST-TRIALS": [
    "Prerequisites closed on trial card line items.",
    "Witness roster and safety briefing documented.",
    "Results relayed to program trials lead and ship force.",
  ],
};

const WC_MATERIALS = {
  "PLAN-YARD": ["Planning kit binder", "LOB chart extract", "Turnover checklist"],
  "BLAST-PAINT": ["Abrasive batch cert", "Coating lot sheets", "Holiday detector log"],
  "HULL-STEEL": ["Steel heat certs", "Welding wire lot", "NDT request forms"],
  PIPE: ["Flange kits", "Gaskets (rev-controlled)", "Hydro pump authorization"],
  ELEC: ["Cable reel IDs", "Termination hardware kit", "Test equipment cal stickers"],
  "STRUCT-OUTFIT": ["Structural fasteners", "Sealants", "Torque wrench cal"],
  SUBASSY: ["Module interface pins", "Temporary rigging tags", "Shim packs"],
  "WELD-PROD": ["Consumables kit", "PWHT charts", "Hardness survey grid"],
  "TEST-TRIALS": ["Trial card deck", "Instrumentation set", "Safety binder"],
};

const WC_QA = {
  "PLAN-YARD": ["Zone readiness review sign-off", "Planning integration record"],
  "BLAST-PAINT": ["Profile / DFT witness", "Holiday inspection release"],
  "HULL-STEEL": ["VT / UT hold points", "Dimensional release"],
  PIPE: ["Torque witness", "Hydro hold release"],
  ELEC: ["Meg log review", "Energization authorization"],
  "STRUCT-OUTFIT": ["Structural tolerances", "Deck/bulkhead seal inspection"],
  SUBASSY: ["Fit-up inspection", "Lift readiness"],
  "WELD-PROD": ["Visual weld inspection", "NDT disposition"],
  "TEST-TRIALS": ["Trial prerequisite closure", "Safety swim brief"],
};

/** @param {string} code */
export function stepsForWorkCenter(code) {
  return WC_STEPS[code] ?? WC_STEPS.PIPE;
}

/** @param {string} code */
export function materialsForWorkCenter(code) {
  return WC_MATERIALS[code] ?? WC_MATERIALS.PIPE;
}

/** @param {string} code */
export function qaForWorkCenter(code) {
  return WC_QA[code] ?? WC_QA.PIPE;
}

/**
 * Build display model for HII-style routing sheet from a job row (API or demo).
 * @param {object} job
 */
export function buildHiiWorkOrderDocument(job) {
  const wc = INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === job.workCenterCode);
  const code = job.workCenterCode || "PIPE";
  const issued = job.dateCreated ? new Date(job.dateCreated) : new Date();
  const revSeed =
    typeof job.id === "number"
      ? Math.abs(job.id) % 4
      : [...String(job.woNumber ?? "")].reduce((a, c) => a + c.charCodeAt(0), 0) %
        4;
  const rev = String.fromCharCode(65 + revSeed);

  return {
    woNumber: job.woNumber,
    revision: rev,
    issuedDate: issued.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    programLine: job.buildContext || "Surface ship new construction / modernization (demo label)",
    ship: job.ship
      ? `${job.ship.shipClass} ${job.ship.hullNumber}${job.ship.displayLabel ? ` (${job.ship.displayLabel})` : ""}`
      : "—",
    workCenterName: wc?.name ?? job.department ?? "Work center",
    workCenterCode: code,
    department: job.department,
    phase: job.phase ?? "—",
    workPackageCode: job.workPackageCode ?? `WP-DEMO-${code}-REL`,
    drawingRef: job.drawingRef ?? "See planning index — attach latest approved revision",
    zone: job.zone ?? "Assign zone / frame block per shipyard LOB",
    scheduleCode: job.scheduleCode ?? "LOB segment TBD",
    scope: job.jobDescription,
    plannedHours: job.allocatedHours ?? "—",
    status: job.status ?? "OPEN",
    steps: stepsForWorkCenter(code),
    materials: materialsForWorkCenter(code),
    qaHoldPoints: qaForWorkCenter(code),
    notes: job.notes || null,
  };
}
