import { workCenterLabel, INGALLS_PASCAGOULA_WORK_CENTERS } from "./ingalls-work-centers.js";

const byCode = (c) => INGALLS_PASCAGOULA_WORK_CENTERS.find((w) => w.code === c);

/** Invented Ingalls-style routing references for demo seed data only — not government or HII proprietary data. */
function syntheticRoutingRefs(ship, item, seq) {
  const phaseShort = (item.phase || "OUT").replace(/\s+/g, "").slice(0, 5).toUpperCase();
  const rev = ["A", "B", "C", "D"][seq % 4];
  return {
    workPackageCode: `WP-2026-${ship.shipClass}-${item.code}-${String(seq).padStart(2, "0")}`,
    drawingRef: `${470 + seq * 3}-${210 + (seq % 7)}-${9900000 + seq * 211} Rev ${rev}`,
    zone: `OB-${(seq % 6) + 1} · Fr ${40 + seq * 22}–${55 + seq * 22} · Staging ${(seq % 4) + 1}`,
    scheduleCode: `LOB-${phaseShort}-${seq}${seq % 2 === 0 ? "A" : "B"}`,
  };
}

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
        workPackageCode: "WP-2026-DG51-OUT-OLB-0401",
        drawingRef: "470-800-9912042 Rev D (zone control index)",
        zone: "Planning Yard support · OB-3 turnover board",
        scheduleCode: "LOB-OUT-12A",
      },
      {
        code: "PIPE",
        phase: "Hull / utilities",
        desc: "JP-5 service loop 3–5: hydraulic torque sequence + VT witness per COMNAVSEA drawing index.",
        workPackageCode: "WP-2026-DG51-PIP-SVC-1184",
        drawingRef: "500-200-8811033 Rev B (piping assembly)",
        zone: "P-1, Fr 165-210, Port · VLS alley cableway",
        scheduleCode: "LOB-HULL-14B",
      },
      {
        code: "ELEC",
        phase: "Combat systems cableway",
        desc: "ANEW coax rough-in from CIWS foundation to ECM deckhouse — EMI survey gate before foil pull.",
        workPackageCode: "WP-2026-DG51-ELEC-CS-2201",
        drawingRef: "600-500-7700144 Rev C (shipboard cable schedule)",
        zone: "Deckhouse L04 · Cableway CS-17",
        scheduleCode: "LOB-CSYS-09A",
      },
      {
        code: "STRUCT-OUTFIT",
        phase: "Deckhouse closure",
        desc: "Fwd CIWS magazine hatch — shell continuity & sill flatness QC hold point.",
        workPackageCode: "WP-2026-DG51-STR-CIWS-0550",
        drawingRef: "100-800-4429001 Rev A (CIWS foundation)",
        zone: "Fwd 01 · Hatch opening CIWS-1",
        scheduleCode: "LOB-DH-07C",
      },
      {
        code: "BLAST-PAINT",
        phase: "Tank / void",
        desc: "Fo’c’sle void — SP-10 abrasive profile + tank coat holiday spark test bundle.",
        workPackageCode: "WP-2026-DG51-PRES-TK-3312",
        drawingRef: "700-400-5512008 Rev B (tank coatings)",
        zone: "Fo’c’sle void TK-04-12",
        scheduleCode: "LOB-PRES-11D",
      },
      {
        code: "TEST-TRIALS",
        phase: "Sea trials prep",
        desc: "Deck CG migration — inclining experiment prerequisites & draft marks witness.",
        workPackageCode: "WP-2026-DG51-TRIAL-INST-9900",
        drawingRef: "800-900-1100333 Rev A (trial card index)",
        zone: "Waterline · Draft marks · Mobility barge window T-14",
        scheduleCode: "LOB-ST-01A",
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
    const hullTag = `${ship.shipClass}${ship.hullNumber}`;
    const woNumber = `ISB-${hullTag}-${item.code}-${String(seq).padStart(3, "0")}`;
    const synth = syntheticRoutingRefs(ship, item, seq);
    rows.push({
      woNumber,
      department: dept,
      workCenterCode: item.code,
      jobDescription: item.desc,
      phase: item.phase,
      buildContext: pack.program,
      workPackageCode: item.workPackageCode ?? synth.workPackageCode,
      drawingRef: item.drawingRef ?? synth.drawingRef,
      zone: item.zone ?? synth.zone,
      scheduleCode: item.scheduleCode ?? synth.scheduleCode,
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
