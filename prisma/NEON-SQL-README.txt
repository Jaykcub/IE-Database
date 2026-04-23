Hullboard — loading demo data into Neon
========================================

Neon does not use a separate “database file” like SQLite. You connect with a URL and either:

  A) SQL file (below), or
  B) From your machine:  pnpm db:push   then   pnpm db:seed   with DATABASE_URL set.


Option A — Paste SQL in Neon
----------------------------
1. In Neon: branch → SQL Editor.
2. First-time schema: from your PC (same repo), with DATABASE_URL pointing at Neon, run:

     pnpm db:push

   That creates tables to match prisma/schema.prisma.

3. Open prisma/neon-demo-data.sql (or paste its full contents).
4. Run it once. It TRUNCATES existing Hullboard demo tables then inserts users, ships, jobs,
   metrics, assistance, and call-board rows (same idea as prisma/seed.mjs).

Re-generating the SQL after template changes:

     pnpm db:generate-neon-sql

   (writes prisma/neon-demo-data.sql)


Option B — Seed without SQL file
--------------------------------
  pnpm db:push
  pnpm db:seed

Never commit real passwords or paste connection strings into chat.
