# Deployment runbook — Vercel · Render · Neon

This app is a **pnpm monorepo** with two deploy targets:

- `apps/web` (Next.js portfolio) → **Vercel**
- `apps/api` (Nest.js) → **Render** (free tier), talking to → **Neon** Postgres

The assistant built and verified all of this locally (including the Docker image
Render will run). The steps below are the parts that need **your** accounts and
dashboards. Do them in order — Step 3 (Vercel Root Directory) is the one that can
break the live site if skipped.

> **Cost:** Neon has a free tier (scale-to-zero). Render's free web service is
> free but **sleeps after ~15 min idle** (first request after that cold-starts in
> ~30–60s). Fine for a portfolio.

---

## Step 1 — Neon Postgres

1. Create a Postgres database at **neon.tech** (or via the Vercel dashboard →
   *Storage → Marketplace → Neon*). Either way the DB is a Neon project.
2. From the Neon dashboard, copy **two** connection strings:
   - **Pooled** connection → this becomes `DATABASE_URL` (has `-pooler` in the host).
   - **Direct** connection → this becomes `DIRECT_URL` (no `-pooler`).
3. Keep them handy for Step 2. **They go on Render, not Vercel** — the API is the
   database consumer, not the frontend.

## Step 2 — Render (Nest.js API)

1. Push this repo to GitHub if you haven't.
2. Render → **New → Web Service** → connect the repo.
3. Configure:
   - **Runtime:** Docker
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Docker build context:** repo root (`.`) — the Dockerfile requires this.
   - **Health check path:** `/api/health`
4. Add environment variables:
   - `DATABASE_URL` = Neon **pooled** string
   - `DIRECT_URL` = Neon **direct** string
   - `WEB_ORIGIN` = your Vercel URL (e.g. `https://alek-portfolio.vercel.app`) —
     comma-separate if you have several (prod + preview).
   - (`PORT` is provided by Render automatically.)
5. Deploy. On boot the container runs `prisma migrate deploy` (creates the `Item`
   table) then starts Nest. Verify: open `https://<your-service>.onrender.com/api/health`
   → should return `{"status":"ok","db":"ok"}`.
6. Copy the Render service URL for Step 3.

## Step 3 — Vercel (Next.js frontend) ⚠️ do this before the monorepo change reaches production

The repo moved from a single Next.js app at the root to `apps/web`. Your existing
Vercel project must be told where the app now lives, **or its next deploy fails**.

1. Vercel → your project → **Settings → General → Root Directory** → set to
   **`apps/web`** → Save.
2. **Settings → Environment Variables** → add:
   - `NEXT_PUBLIC_API_URL` = your Render URL from Step 2 (e.g.
     `https://alek-api.onrender.com`). No trailing slash.
3. Redeploy (or push). Vercel detects the pnpm workspace, builds `apps/web`
   (which compiles `@repo/shared` first via the build script).

> Tip: verify on a **preview deployment** before promoting to production.

## Step 4 — Verify end-to-end

- Open the live site's **/lab** page → it should list items fetched from the
  Render API, and adding one should persist (survives refresh).
- If the list is empty or errors: check `NEXT_PUBLIC_API_URL` (Vercel) and
  `WEB_ORIGIN` (Render) match your real URLs — a CORS or URL mismatch is the usual
  cause. The browser console will show a CORS error if `WEB_ORIGIN` is wrong.

---

## Local development (reference)

```bash
pnpm install
pnpm db:up                                   # local Postgres in Docker
cd apps/api && cp .env.example .env          # local DB URLs (already gitignored)
pnpm --filter api exec prisma migrate dev    # create tables
pnpm --filter api exec ts-node prisma/seed.ts
cd ../.. && pnpm dev                          # web :3000  +  api :3001
```

Web reads the API base URL from `apps/web/.env.local` (`NEXT_PUBLIC_API_URL`,
defaults to `http://localhost:3001`).
