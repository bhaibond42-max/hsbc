# HSBC Demo

A practice mobile banking app. It is **not** HSBC, it is not connected to HSBC, and it does not move real money.

Customers can log on, see balances, browse transactions, make demo payments between practice accounts, and download a CSV statement. Staff can manage customers, add or deduct demo funds, post and reverse transactions, and read an audit log.

## Demo log on

| | Email | Password |
|---|---|---|
| Customer | user@hsbcuk.co.uk | User@12345 |
| Staff | admin@hsbcuk.co.uk | Admin@12345 |

John Reed’s current account starts at **£5,000.00**. Other customers use the same password.

## Local setup

PostgreSQL 14+ is required. Docker is not used.

```bash
npm install
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` and `DIRECT_URL` to your Postgres instance. Create the database, then:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000. The layout is built for a phone first (375–430px). On a wider screen the same screens sit beside a side menu.

## Vercel (team [hsbc7](https://vercel.com/hsbc7))

### 1. Database (Vercel Postgres, not Supabase)

In the **hsbc7** team: **Storage → Create database → Postgres**, then **Connect** it to your `hsbc-bank` project. Vercel adds `POSTGRES_*` variables automatically.

Map them for Prisma (Production + Preview + Development):

| You set      | Copy from (Vercel Postgres)   |
|-------------|--------------------------------|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` (or Neon’s `DATABASE_URL`) |

Prisma migrations use `POSTGRES_URL_NON_POOLING` (Neon adds this automatically when the store is connected).

Also set:

- `APP_URL` — your public URL, e.g. `https://your-app.vercel.app`
- `DEMO_EXPOSE_RESET_LINK` — `false` on a public site

After the first deploy, seed demo data once (from your machine, with env pointing at the new DB):

```bash
npm run db:seed
```

Demo log on: `user@hsbcuk.co.uk` / `User@12345`, `admin@hsbcuk.co.uk` / `Admin@12345`.

### 2. Deploy from this repo

The CLI must be logged into the **hsbc7** account (`npx vercel login`). Then:

```bash
cd hsbc-bank
Remove-Item .vercel -Recurse -Force -ErrorAction SilentlyContinue
npx vercel link --yes --scope hsbc7 --project hsbc-bank
npx vercel deploy --prod --yes
```

Build command: `npm run vercel-build` (generate client, run migrations, build Next.js).

## Checks

```bash
npm run typecheck
npm run lint
npm test
```
