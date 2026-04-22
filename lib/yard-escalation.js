/**
 * Shipyard coordination model — synthesized from **public** HII / Ingalls materials
 * and common US naval shipyard practice. Hullboard does not contain proprietary
 * HII procedures; use this as training / UX guidance only.
 *
 * Sources (public):
 * - HII “Ingalls’ Planning Yard” — planning, engineering, logistics, material
 *   procurement & kitting, configuration management, on-site support (hii.com).
 * - Ingalls job postings — Production Planning & Scheduling coordinates schedules,
 *   material, QA, manufacturing, purchasing, engineering, inventory (Indeed).
 * - NSAM / Navy ManTech — Ingalls production planning integrates engineering data
 *   into work-package scoping, billing, MBOMs (NSAM project narrative).
 */

export const OPERATIONS_SUMMARY = {
  title: "How Ingalls Pascagoula work is coordinated (public summary)",
  bullets: [
    "Surface combatant and amphib programs run with Operations and Program Management leadership; production facilities execute outfitting, hull, and test blocks in parallel where possible.",
    "The Planning Yard (separate from hull construction lines) publicly supports fleet modernization work: availability planning, engineering support, logistics, material procurement and kitting, configuration data, and emergent technical support for in-service classes (per HII capability page).",
    "Production Planning and Scheduling roles publicly coordinate master schedules, material timing, work order / traveler inputs, and cross-functional touchpoints with QA, manufacturing, purchasing, engineering, and inventory control. When the floor hits a constraint, schedule and material paths are the spine that pulls in the right support functions.",
    "Industry programs (for example NSAM technology projects) describe work packages flowing from engineering data through industrial engineering and production planning; the WP, drawing, and zone fields in Hullboard mimic that paper trail for training only.",
  ],
};

/**
 * Who to engage first vs escalate — **generic** shipyard pattern aligned to Hullboard roles.
 */
export const ESCALATION_ROUTING = [
  {
    situation: "Execution within one trade (torque sequence, weld pass, fit-up)",
    firstCall:
      "Shop foreman for that work center first (Hullboard: Foreman assistance tab).",
    escalate:
      "Trade-boundary or sequence conflict: Production planning / scheduling plus IE for router and hours; capture in job notes.",
  },
  {
    situation: "Drawing conflict, EC / shipalt, spec interpretation",
    firstCall:
      "Engineering or design owner (Hullboard: Engineering board tab for tech queries).",
    escalate:
      "Program configuration / Planning Yard support for sustainment (public Planning Yard scope); new construction follows program engineering and planning workflow.",
  },
  {
    situation: "Material missing, kit short, wrong revision in kit",
    firstCall:
      "Supply chain / material control (expedite, swap, kit correction); align with PP&S so schedule reflects reality.",
    escalate:
      "Procurement / buyer loop when purchase action or vendor date drives the slip.",
  },
  {
    situation: "Schedule clash between trades or crane / waterfront window",
    firstCall: "Production planning and scheduling — rebaseline line-of-balance segment.",
    escalate: "Program / operations when a hull milestone is at risk.",
  },
  {
    situation: "Safety stop, NDT / weld reject, QC hold",
    firstCall: "QA plus foreman — controlled rework traveler.",
    escalate: "Engineering if disposition requires design authority.",
  },
];

export const DISCLAIMER =
  "Hullboard demo data and routing text are not official HII instructions. Follow your yard’s controlled procedures, ERP, and safety rules.";
