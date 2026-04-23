/**
 * One-shot: align Neon schema with prisma/schema.prisma and load seed data.
 * Requires DATABASE_URL in .env or .env.local (never commit real URLs).
 */
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name, overrideExisting) {
  const p = resolve(root, name);
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split(/\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (overrideExisting || process.env[key] === undefined) process.env[key] = val;
  }
}

// Same order as Next.js: .env then .env.local overrides (do not rely on import order alone)
loadEnvFile(".env", false);
loadEnvFile(".env.local", true);

const url = process.env.DATABASE_URL?.trim();
if (!url || url.includes("USER:PASSWORD") || url.includes("ep-xxx")) {
  console.error(`
[sync-db] DATABASE_URL is missing or still a placeholder.

  1. Copy .env.example to .env
  2. In Neon → your branch → Connection → copy the URI (pooled is fine)
  3. Paste into .env as:  DATABASE_URL="postgresql://..."

Then run:  pnpm db:sync
`);
  process.exit(1);
}

if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error("[sync-db] DATABASE_URL must start with postgresql:// or postgres://");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: root, shell: true, env: process.env });
}

console.log("\n[sync-db] prisma generate\n");
run("pnpm exec prisma generate");

console.log("\n[sync-db] prisma db push  (creates/updates tables on Neon)\n");
run("pnpm exec prisma db push");

console.log("\n[sync-db] prisma db seed  (demo users, ships, jobs, metrics)\n");
run("pnpm exec prisma db seed");

console.log("\n[sync-db] Done. Restart `pnpm dev` and reload the Jobs page.\n");
