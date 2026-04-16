# Shipset IE Analytics

Full-stack Next.js app for comparing IE task metrics across shipsets (DDG, LHA, LPD), flagging high variance, and reviewing efficiency drivers.

## Stack

- Frontend: Next.js + React + Tailwind
- Backend: Next.js Route Handlers (`src/app/api`)
- Database: PostgreSQL via Prisma

## Local development

1. Copy environment file and set your database URL:
  - `copy .env.example .env`
2. Install and initialize:
  - `npm install`
  - `npx prisma generate`
  - `npx prisma db push`
  - `npm run db:seed`
3. Run:
  - `npm run dev`

## Deploy free (Vercel + Neon)

1. Create a free PostgreSQL database at [Neon](https://neon.tech/).
2. Copy the Neon pooled connection string and set `DATABASE_URL`.
3. Push this repo to GitHub.
4. Import the repo in [Vercel](https://vercel.com/).
5. In Vercel project settings, add:
  - `DATABASE_URL` = your Neon connection string
6. Deploy once, then initialize schema/data:
  - Option A (recommended): run locally against Neon
    - `npx prisma db push`
    - `npm run db:seed`
  - Option B: run in Vercel shell/CI after deploy.
7. Redeploy if needed and open your production URL.

## Notes

- `db:seed` clears and reseeds tables by design. Do not run it on production after real data exists.
- Use the UI to run analysis and filter high-variance drivers.

