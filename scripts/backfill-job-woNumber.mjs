/**
 * One-time helper: older Neon DBs may have `Job` rows without `woNumber`.
 * Run before `pnpm db:push` if push fails on "required column woNumber".
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ override: true });

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Job' AND column_name = 'woNumber'
  ) THEN
    ALTER TABLE "Job" ADD COLUMN "woNumber" text;
    UPDATE "Job" SET "woNumber" = 'LEGACY-WO-' || id::text WHERE "woNumber" IS NULL;
    ALTER TABLE "Job" ALTER COLUMN "woNumber" SET NOT NULL;
  END IF;
END $$;
`;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(sql);
  console.log("Job.woNumber backfill OK (or column already existed).");
} finally {
  await pool.end();
}
