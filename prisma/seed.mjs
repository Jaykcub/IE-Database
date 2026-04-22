import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import {
  INGALLS_PASCAGOULA_WORK_CENTERS,
  workCenterLabel,
} from "../lib/ingalls-work-centers.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Demo job text per work center code — illustrative only */
const JOB_COPY = {
  "PLAN-YARD": (hull) =>
    `Work package staging & line-of-balance review — hull ${hull} (Planning Yard)`,
  "BLAST-PAINT": () =>
    "Abrasive blast profile SSPC-SP 10 zone + intermediate coat hold point",
  "HULL-STEEL": () =>
    "Block 14 shell insert — tack-up and FA weld per structural travelers",
  PIPE: () =>
    "HP air header run L03–L05 — fit-check prior to hydro (pipe fab shop)",
  ELEC: () =>
    "Cable pull schedule: fore peak to IC room — megger witness pending",
  "STRUCT-OUTFIT": () =>
    "Main deck hatch coaming — alignment pins and shell continuity check",
  SUBASSY: () =>
    "Propulsion module subassembly — borescope port prep and QA hold",
  "WELD-PROD": () =>
    "Longitudinal seam sequence 4-of-6 — WPS 4211, VT per segment",
  "TEST-TRIALS": () =>
    "Sea trials MRC bundle dry run — waterfront crane window 0600–1000",
};

const STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED"];

function pickStatus(i) {
  return STATUSES[i % STATUSES.length];
}

async function main() {
  console.log("Seeding Hullboard demo data (Ingalls-style work centers)…");

  await prisma.job.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.ship.deleteMany();

  const shipsData = [
    { shipClass: "DDG", hullNumber: 128 },
    { shipClass: "DDG", hullNumber: 129 },
    { shipClass: "LHA", hullNumber: 8 },
    { shipClass: "LPD", hullNumber: 28 },
    { shipClass: "DDGX", hullNumber: 3 },
  ];

  const ships = [];
  for (const s of shipsData) {
    ships.push(await prisma.ship.create({ data: s }));
  }

  const categories = [
    "Labor Hours",
    "Cost Variance",
    "Schedule Variance",
    "Defect Rate",
    "Material Spend",
  ];

  let jobIdx = 0;
  for (const ship of ships) {
    const hullLabel = `${ship.shipClass}-${ship.hullNumber}`;

    for (const wc of INGALLS_PASCAGOULA_WORK_CENTERS) {
      const dept = workCenterLabel(wc);
      const fn = JOB_COPY[wc.code];
      const desc = fn ? fn(hullLabel) : `${dept} — standard hull support (demo)`;
      const allocated = 40 + (jobIdx % 7) * 12 + (wc.code.length % 5) * 8;
      const drift = (jobIdx % 5) * 3 - 6;
      const actual =
        jobIdx % 4 === 0 ? null : Math.max(0, allocated + drift + 0.5);

      await prisma.job.create({
        data: {
          shipId: ship.id,
          department: dept,
          jobDescription: desc,
          allocatedHours: allocated,
          actualHours: actual,
          materialCost: 2500 + (jobIdx % 11) * 1800,
          notes:
            jobIdx % 3 === 0
              ? "Demo note: material release OK; next gate E-2 electrical safe."
              : null,
          status: pickStatus(jobIdx),
        },
      });
      jobIdx += 1;
    }

    for (const cat of categories) {
      for (const wc of INGALLS_PASCAGOULA_WORK_CENTERS.slice(0, 5)) {
        let value = 1000 + jobIdx + ship.id * 10;
        if (cat === "Labor Hours") value = 12000 + (ship.id % 4) * 900;
        if (cat === "Cost Variance") value = (jobIdx % 7) * 0.4 - 1;
        if (cat === "Schedule Variance") value = (jobIdx % 5) * 0.35 - 0.5;
        if (cat === "Defect Rate") value = 0.8 + (jobIdx % 4) * 0.15;
        if (cat === "Material Spend") value = 180000 + ship.id * 12000;

        await prisma.metric.create({
          data: {
            shipId: ship.id,
            department: workCenterLabel(wc),
            category: cat,
            value: Math.round(value * 100) / 100,
          },
        });
      }
    }
  }

  console.log(
    `Done: ${ships.length} hulls, ${jobIdx} jobs, metrics for demo filters.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
