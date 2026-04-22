import { workCenterLabel, INGALLS_PASCAGOULA_WORK_CENTERS } from "./ingalls-work-centers.js";

const byCode = (c) => INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === c);

/**
 * Hull- and class-specific work order blueprints (demo / training data).
 * `key` format: "DDG-129" (class + hull)
 */
const HULL_PACKS = {
  "DDG-129": {
    program: "DDG Flight IIA — Aegis Baseline 9C2 (demo label)",
    items: [
      {
        code: "PLAN-YARD",
        phase: "Outfit / planning",
        desc: "Line-of-balance & zone turnover — aft VLS alley staging (DDG 129 new-build band).",
      },
      {
        code: "PIPE",
        phase: "Hull / utilities",
        desc: "JP-5 service loop 3–5: hydraulic torque sequence + VT witness per COMNAVSEA drawing index.",
      },
      {
        code: "ELEC",
        phase: "Combat systems cableway",
        desc: "ANEW coax rough-in from CIWS foundation to ECM deckhouse — EMI survey gate before foil pull.",
      },
      {
        code: "STRUCT-OUTFIT",
        phase: "Deckhouse closure",
        desc: "Fwd CIWS magazine hatch — shell continuity & sill flatness QC hold point.",
      },
      {
        code: "BLAST-PAINT",
        phase: "Tank / void",
        desc: "Fo’c’sle void — SP-10 abrasive profile + tank coat holiday spark test bundle.",
      },
      {
        code: "TEST-TRIALS",
        phase: "Sea trials prep",
        desc: "Deck CG migration — inclining experiment prerequisites & draft marks witness.",
      },
    ],
  },
  "DDG-128": {
    program: "DDG Flight IIA — repeat hull (demo)",
    items: [
      {
        code: "HULL-STEEL",
        phase: "Structural",
        desc: "Shell insert at frame 275 — FA weld UT sampling per traveler W-884 (sister ship lessons learned).",
      },
      {
        code: "WELD-PROD",
        phase: "Structural",
        desc: "Longitudinal seam VT — sequence 7-of-12, interpass temp tracking.",
      },
      {
        code: "SUBASSY",
        phase: "Integration",
        desc: "Deckhouse module L4 — grillage pin alignment & module pull-in cable tension log.",
      },
      {
        code: "PIPE",
        phase: "Weapons / aux",
        desc: "Dry fire mains forward zone — flange management & hydro hold package.",
      },
    ],
  },
  "LHA-8": {
    program: "America class — amphibious readiness (demo)",
    items: [
      {
        code: "PLAN-YARD",
        phase: "Well deck",
        desc: "Well dock ballast valve package — docking blocks load-out sequence & stress callouts.",
      },
      {
        code: "STRUCT-OUTFIT",
        phase: "Aviation island",
        desc: "Island lift lug — weld map & loose gear sweep prior to crane window.",
      },
      {
        code: "ELEC",
        phase: "Ship service",
        desc: "Hangar bay 450 Hz loop — cable routing conflict resolution vs fire boundary.",
      },
      {
        code: "PIPE",
        phase: "Fuel / ballast",
        desc: "JP-5 transfer manifold — bleed sequence & gasket registry for first fill.",
      },
      {
        code: "SUBASSY",
        phase: "Cargo systems",
        desc: "Ramp machinery module — borescope bore alignment & dowel pin substitution log.",
      },
    ],
  },
  "LPD-28": {
    program: "San Antonio variant — expeditionary support (demo)",
    items: [
      {
        code: "HULL-STEEL",
        phase: "Structural",
        desc: "Mid-body transverse bulkhead continuity — distortion control plan vs summer heat soak.",
      },
      {
        code: "PIPE",
        phase: "Machinery",
        desc: "Main seawater crossover — zinc isolation check & flange torquemap.",
      },
      {
        code: "BLAST-PAINT",
        phase: "Preservation",
        desc: "Well deck overhead — stripe coat holiday repair prior to troop walkthrough.",
      },
      {
        code: "TEST-TRIALS",
        phase: "Harbor trials",
        desc: "Deck-edge dewatering demonstration — choreography with tug & line handlers.",
      },
    ],
  },
  "DDGX-3": {
    program: "Future large surface combatant envelope (demo-only label)",
    items: [
      {
        code: "PLAN-YARD",
        phase: "Digital twin handoff",
        desc: "MBSE work package reconcile — zone 440 outfit vs laser scan delta resolution.",
      },
      {
        code: "SUBASSY",
        phase: "Mission module",
        desc: "Deckhouse utility spine — provisional cable stack & EMI boundary mock fit.",
      },
      {
        code: "WELD-PROD",
        phase: "Low-signature inserts",
        desc: "Ultra-HY steel insert coupon — PWHT recipe trace & hardness map.",
      },
      {
        code: "ELEC",
        phase: "Power electronics",
        desc: "Integrated power chassis — coolant loop burp & glycol sampling ROE.",
      },
    ],
  },
};

function fallbackPack(shipClass, hullNumber) {
  const label = `${shipClass}-${hullNumber}`;
  return {
    program: `${shipClass} hull ${hullNumber} — standard build band (generic demo)`,
    items: [
      {
        code: "PLAN-YARD",
        phase: "Planning",
        desc: `Work packaging & milestones for ${label} — zone readiness review.`,
      },
      {
        code: "PIPE",
        phase: "Outfitting",
        desc: `Distributed systems rough-in — ${label} QA hold matrix.`,
      },
      {
        code: "WELD-PROD",
        phase: "Fabrication",
        desc: `Hull/yards welding sequence — traveler alignment for ${label}.`,
      },
    ],
  };
}

/**
 * Return prisma-ready job rows for a ship record (shipClass, hullNumber numeric).
 */
export function buildJobsForShip(ship) {
  const key = `${ship.shipClass}-${ship.hullNumber}`;
  const pack = HULL_PACKS[key] ?? fallbackPack(ship.shipClass, ship.hullNumber);

  const rows = [];
  let seq = 1;
  for (const item of pack.items) {
    const wc = byCode(item.code);
    const dept = wc ? workCenterLabel(wc) : item.code;
    const woNumber = `WO-${ship.shipClass}-${ship.hullNumber}-${item.code}-${String(seq).padStart(3, "0")}`;
    rows.push({
      woNumber,
      department: dept,
      workCenterCode: item.code,
      jobDescription: item.desc,
      phase: item.phase,
      buildContext: pack.program,
      allocatedHours: 24 + (seq % 8) * 12,
      actualHours: null,
      materialCost: null,
      notes:
        seq % 4 === 0 ? "Hold: coordination with waterfront crane window." : null,
      status: seq % 5 === 0 ? "IN_PROGRESS" : "OPEN",
      dateCreated: new Date(Date.now() - seq * 3600000),
    });
    seq += 1;
  }

  return rows;
}
