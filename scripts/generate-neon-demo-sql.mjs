/**
 * Generates prisma/neon-demo-data.sql — same demo payload as prisma/seed.mjs.
 * Run: node scripts/generate-neon-demo-sql.mjs
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { buildJobsForShip } from "../lib/job-templates.js";
import {
  METRIC_CATEGORIES,
  METRIC_DEPARTMENTS,
} from "../lib/metric-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" && !Number.isFinite(val)) return "NULL";
  if (val instanceof Date)
    return `'${val.toISOString()}'::timestamptz`;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const users = [
  ["Alex Rivera", "TECHNICIAN", "Pipe Fabrication & Installation", "Pipefitter A"],
  ["Jordan Mills", "TECHNICIAN", "Welding Production", "Welder B"],
  ["Sam Okonkwo", "FOREMAN", "Pipe Fabrication & Installation", "Pipe Shop Foreman"],
  ["Riley Nguyen", "FOREMAN", "Electrical & Shipboard Cable", "Electrical Foreman"],
  ["Dr. Casey Lin", "ENGINEER", null, "Hull Mechanical Engineer"],
  ["Morgan Stiles", "IE", null, "Industrial Engineer"],
  ["Admin Demo", "ADMIN", null, "Yard Administrator"],
];

const shipDefs = [
  ["DDG", 129, "DDG 129 (demo build band)"],
  ["DDG", 128, "DDG 128"],
  ["LHA", 8, "LHA 8"],
  ["LPD", 28, "LPD 28"],
  ["DDGX", 3, "DDGX 3 (technology demonstrator)"],
];

function metricValue(cat, mi, deptIdx, shipId) {
  const deptFactor = 1 + deptIdx * 0.06 + (shipId % 4) * 0.015;
  let value = (10000 + shipId * 1000 + mi) * deptFactor;
  if (cat === "Labor Hours") {
    value = (14000 + shipId * 800 + deptIdx * 120) * deptFactor;
  } else if (cat === "Cost Variance") {
    value =
      ((mi % 5) * 0.35 - 0.4 + deptIdx * 0.02) * (0.92 + (shipId % 3) * 0.04);
  } else if (cat === "Schedule Variance") {
    value =
      ((mi % 4) * 0.25 - 0.3 + deptIdx * 0.015) * (0.92 + (shipId % 3) * 0.04);
  } else if (cat === "Defect Rate") {
    value =
      (0.9 + (mi % 3) * 0.12 + deptIdx * 0.008) * (0.98 + (shipId % 2) * 0.02);
  } else if (cat === "Material Spend") {
    value = (220000 + shipId * 15000 + deptIdx * 8000) * deptFactor;
  }
  return Math.round(value * 100) / 100;
}

const lines = [];
lines.push(`-- Hullboard demo data (matches prisma/seed.mjs)`);
lines.push(`-- Run AFTER: pnpm db push  (creates tables on Neon)`);
lines.push(`-- Paste into Neon SQL Editor or: psql $DATABASE_URL -f prisma/neon-demo-data.sql`);
lines.push("");
lines.push("BEGIN;");
lines.push(
  `TRUNCATE TABLE "CallBoardEntry", "AssistanceRequest", "WorkSession", "Job", "Metric", "Ship", "User" RESTART IDENTITY CASCADE;`,
);
lines.push("");

let userId = 1;
for (const [name, role, scope, title] of users) {
  lines.push(
    `INSERT INTO "User" ("id", "name", "role", "departmentScope", "title") VALUES (${userId}, ${esc(name)}, ${esc(role)}, ${scope == null ? "NULL" : esc(scope)}, ${esc(title)});`,
  );
  userId += 1;
}
lines.push("");

let shipId = 1;
const shipRows = [];
for (const [shipClass, hullNumber, displayLabel] of shipDefs) {
  lines.push(
    `INSERT INTO "Ship" ("id", "hullNumber", "shipClass", "displayLabel") VALUES (${shipId}, ${hullNumber}, ${esc(shipClass)}, ${esc(displayLabel)});`,
  );
  const jobs = buildJobsForShip({
    id: shipId,
    shipClass,
    hullNumber,
    displayLabel,
  });
  for (const j of jobs) {
    lines.push(
      `INSERT INTO "Job" ("shipId", "woNumber", "department", "workCenterCode", "jobDescription", "phase", "buildContext", "workPackageCode", "drawingRef", "zone", "scheduleCode", "allocatedHours", "actualHours", "materialCost", "notes", "status", "dateCreated") VALUES (${shipId}, ${esc(j.woNumber)}, ${esc(j.department)}, ${j.workCenterCode == null ? "NULL" : esc(j.workCenterCode)}, ${esc(j.jobDescription)}, ${j.phase == null ? "NULL" : esc(j.phase)}, ${j.buildContext == null ? "NULL" : esc(j.buildContext)}, ${j.workPackageCode == null ? "NULL" : esc(j.workPackageCode)}, ${j.drawingRef == null ? "NULL" : esc(j.drawingRef)}, ${j.zone == null ? "NULL" : esc(j.zone)}, ${j.scheduleCode == null ? "NULL" : esc(j.scheduleCode)}, ${j.allocatedHours}, NULL, NULL, ${j.notes == null ? "NULL" : esc(j.notes)}, ${esc(j.status)}, ${esc(j.dateCreated)});`,
    );
  }
  let deptIdx = 0;
  for (const dept of METRIC_DEPARTMENTS) {
    let mi = 0;
    for (const cat of METRIC_CATEGORIES) {
      const v = metricValue(cat, mi, deptIdx, shipId);
      lines.push(
        `INSERT INTO "Metric" ("shipId", "department", "category", "value") VALUES (${shipId}, ${esc(dept)}, ${esc(cat)}, ${v});`,
      );
      mi += 1;
    }
    deptIdx += 1;
  }
  shipRows.push({ shipId, shipClass, hullNumber });
  shipId += 1;
}

lines.push("");
lines.push(
  `-- Assistance + call board on first DDG 129–style WO (same as seed lookup)`,
);
lines.push(
  `DO $$`,
);
lines.push(`DECLARE jid int; aid int; eid int;`);
lines.push(`BEGIN`);
lines.push(
  `  SELECT j."id" INTO jid FROM "Job" j INNER JOIN "Ship" s ON s."id" = j."shipId" WHERE s."shipClass" = 'DDG' AND s."hullNumber" = 129 ORDER BY j."id" ASC LIMIT 1;`,
);
lines.push(
  `  SELECT "id" INTO aid FROM "User" WHERE "name" = 'Alex Rivera' LIMIT 1;`,
);
lines.push(
  `  SELECT "id" INTO eid FROM "User" WHERE "name" = 'Dr. Casey Lin' LIMIT 1;`,
);
lines.push(
  `  IF jid IS NOT NULL AND aid IS NOT NULL THEN`,
);
lines.push(
  `    INSERT INTO "AssistanceRequest" ("jobId", "fromUserId", "message", "status") VALUES (jid, aid, 'Need foreman eyes on JP-5 loop torque sequence — interference with adjacent cable tray.', 'PENDING');`,
);
lines.push(`  END IF;`);
lines.push(
  `  IF jid IS NOT NULL AND aid IS NOT NULL AND eid IS NOT NULL THEN`,
);
lines.push(
  `    INSERT INTO "CallBoardEntry" ("jobId", "openedById", "category", "description", "status", "engineerId", "engineerResponse", "resolutionNote", "closedAt")`,
);
lines.push(
  `    VALUES (jid, aid, 'ENGINEERING', 'Request EC review for routing clip spacing vs shock qualification margin.', 'CLOSED', eid, 'Approved alternate clip pattern per sketch SK-4412 rev C — update traveler before hydro.', 'IE notified for standard hours adjustment (+4h planning).', NOW());`,
);
lines.push(`  END IF;`);
lines.push(`END $$;`);
lines.push("");
lines.push("COMMIT;");
lines.push("");

const outPath = join(__dirname, "..", "prisma", "neon-demo-data.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log("Wrote", outPath, "—", lines.length, "lines");
