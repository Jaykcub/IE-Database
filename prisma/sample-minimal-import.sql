-- Minimal Hullboard sample (paste into Neon SQL Editor)
-- Prerequisites: tables exist (run `pnpm prisma db push` once from your PC first).
-- Adds ONE ship (hull 999) and TWO jobs. Safe to re-run: skips if hull 999 / WO# already exist.

BEGIN;

INSERT INTO "Ship" ("hullNumber", "shipClass", "displayLabel")
VALUES (999, 'DDG', 'Sample hull (SQL import)')
ON CONFLICT ("hullNumber") DO NOTHING;

INSERT INTO "Job" (
  "shipId",
  "woNumber",
  "department",
  "workCenterCode",
  "jobDescription",
  "phase",
  "buildContext",
  "workPackageCode",
  "drawingRef",
  "zone",
  "scheduleCode",
  "allocatedHours",
  "actualHours",
  "materialCost",
  "notes",
  "status",
  "dateCreated"
)
SELECT
  s."id",
  'ISB-DDG999-SAMPLE-001',
  'Pipe Fabrication & Installation',
  'PIPE',
  'Sample job imported via SQL — flange torque verification.',
  'Hull / utilities',
  'Training import',
  'WP-SAMPLE-001',
  '500-100-1000001 Rev A',
  'Demo zone · Fr 100–120',
  'LOB-SAMPLE-01A',
  40,
  NULL,
  NULL,
  NULL,
  'OPEN',
  NOW()
FROM "Ship" s
WHERE s."hullNumber" = 999
ON CONFLICT ("woNumber") DO NOTHING;

INSERT INTO "Job" (
  "shipId",
  "woNumber",
  "department",
  "workCenterCode",
  "jobDescription",
  "phase",
  "buildContext",
  "workPackageCode",
  "drawingRef",
  "zone",
  "scheduleCode",
  "allocatedHours",
  "actualHours",
  "materialCost",
  "notes",
  "status",
  "dateCreated"
)
SELECT
  s."id",
  'ISB-DDG999-SAMPLE-002',
  'Planning Yard',
  'PLAN-YARD',
  'Second sample row — staging review.',
  'Planning',
  'Training import',
  'WP-SAMPLE-002',
  '470-200-2000002 Rev B',
  'OB-1 · Staging',
  'LOB-SAMPLE-02B',
  24,
  NULL,
  NULL,
  NULL,
  'OPEN',
  NOW()
FROM "Ship" s
WHERE s."hullNumber" = 999
ON CONFLICT ("woNumber") DO NOTHING;

COMMIT;
