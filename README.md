# Hullboard

Full-stack **Next.js** app (app-only repo) for ship construction metrics and jobs — structured so you can grow toward a broader **MES-style** execution layer on the same stack.

## Stack

| Layer | Choice |
|--------|--------|
| UI + API | **Next.js** + **React** |
| Styling | **Tailwind CSS** |
| ORM | **Prisma** |
| Database | **Neon** (PostgreSQL) |
| Hosting | **Vercel** |
| Package manager | **pnpm** |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/installation) 10 (`corepack enable` then `corepack prepare pnpm@10.33.1 --activate`)

## Local development

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd IE-Database
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set both URLs from [Neon](https://neon.tech/):

   - **`DATABASE_URL`** — pooled connection (Neon *pooler* host). Used by the app and read from **`prisma.config.ts`** (Prisma 7 keeps URLs out of `schema.prisma`).
   - **`DIRECT_URL`** — direct connection to the same database (non-pooler). Also set in **`prisma.config.ts`** so **`pnpm exec prisma migrate`** does not run through the pooler.
   - **`HULLBOARD_SESSION_SECRET`** — at least 32 characters; signs the session cookie for sign-in.

3. **Sign in (demo)**

   Open `/login` and use **`Admin`** / **`Admin`**. All app routes assume **admin** for now.

4. **Work centers (demo)**

   Job filters use an **Ingalls Pascagoula–style work center list** derived from **public** sources (e.g. NIOSH ergonomics reports citing shops such as abrasive blasting, hatch assembly, pipe welding, subassembly grinding, and shipboard cable work; Ingalls materials mentioning the planning yard). **It is not an official HII work-center master.**

5. **Schema and seed**

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

6. **Run**

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | Production build / run |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Regenerate Prisma Client |
| `pnpm db:push` | Push `schema.prisma` to the DB |
| `pnpm db:migrate` | Create/apply dev migrations |
| `pnpm db:migrate:deploy` | Apply migrations (production/CI) |
| `pnpm db:seed` | Seed demo data (`prisma/seed.mjs`) |
| `pnpm db:studio` | Prisma Studio |

## GitHub + Vercel + Neon

1. Create a Neon project; copy **pooled** and **direct** connection strings.
2. Push the repo to **GitHub** and import it in [Vercel](https://vercel.com/).
3. In Vercel → Environment Variables, set `DATABASE_URL`, `DIRECT_URL`, and `HULLBOARD_SESSION_SECRET` (long random string, 32+ chars).
4. For production schema changes, run `pnpm db:migrate:deploy` against Neon from CI or a trusted machine.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `pnpm install`, `prisma validate`, `lint`, and `build` on pushes and pull requests.

## Power BI (later)

Point Power BI at Neon (or a warehouse fed from Neon) using SQL views for reporting.

## SAP materials (later)

Add SAP-backed material rows when integrated; until then a **Material list** link on the job/work order is enough.
