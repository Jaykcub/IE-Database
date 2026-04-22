/**
 * Representative Ingalls Shipbuilding (HII, Pascagoula, MS) work areas / shops
 * for demo routing and filters. Names reflect operations commonly cited in
 * public ergonomics surveys of Ingalls (e.g. abrasive blasting, hatch assembly,
 * pipe welding, subassembly grinding, shipboard cable) and Ingalls public
 * materials (e.g. Planning Yard). This is NOT an official HII work-center master.
 */
export const INGALLS_PASCAGOULA_WORK_CENTERS = [
  {
    code: "PLAN-YARD",
    name: "Planning Yard",
    summary: "Pre-assembly planning and staging (public Ingalls planning-yard operations).",
  },
  {
    code: "BLAST-PAINT",
    name: "Abrasive Blasting & Paint",
    summary: "Surface prep and coatings (cited in public NIOSH Ingalls ergonomics reports).",
  },
  {
    code: "HULL-STEEL",
    name: "Hull / Steel Fabrication",
    summary: "Structural steel and hull block work typical of large naval construction yards.",
  },
  {
    code: "PIPE",
    name: "Pipe Fabrication & Installation",
    summary: "Pipe welding / pipefitting operations (cited in public Ingalls ergonomics reports).",
  },
  {
    code: "ELEC",
    name: "Electrical & Shipboard Cable",
    summary: "Electrical outfitting and cable pulls (cited in public Ingalls ergonomics reports).",
  },
  {
    code: "STRUCT-OUTFIT",
    name: "Structural Outfitting (Hatch & Shell)",
    summary: "Hatch assembly and shell outfitting (cited in public Ingalls ergonomics reports).",
  },
  {
    code: "SUBASSY",
    name: "Subassembly & Module Integration",
    summary: "Subassembly grinding / integration work (cited in public Ingalls ergonomics reports).",
  },
  {
    code: "WELD-PROD",
    name: "Welding Production",
    summary: "Production welding cells supporting surface combatant and amphibs.",
  },
  {
    code: "TEST-TRIALS",
    name: "Test, Trials & Waterfront Support",
    summary: "Sea trials prep and waterfront support blocks.",
  },
];

/** Value stored on Job.department — use display name for readability in UI */
export function workCenterLabel(wc) {
  return wc.name;
}
