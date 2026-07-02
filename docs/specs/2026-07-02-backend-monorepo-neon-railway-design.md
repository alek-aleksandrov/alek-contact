# Design: Backend + Postgres via pnpm monorepo (Vercel · Railway · Neon)

**Date:** 2026-07-02
**Status:** Implemented & verified locally (monorepo, Nest API, Prisma, docker
Postgres, `/lab` end-to-end, and the production Docker image all confirmed
working). **Host: Render free tier** was chosen over Railway to avoid a paid
account — the Dockerfile is host-agnostic. The click-by-click cloud runbook lives
in [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md).

## Context & goal

The portfolio (Next.js on Vercel) needs a real backend + relational database to
demonstrate full-stack ability — specifically **Nest.js + Postgres**, the stack
Alek wants to show. Because Nest.js is a long-running server and Vercel runs
serverless functions, the backend runs on an **always-on host (Railway)**, while
Vercel keeps serving the frontend. Both talk to one **Neon** Postgres database.

Everything lives in **one repo** (a pnpm workspace monorepo) with **two deploy
targets**. First deliverable is a **minimal vertical slice** that proves the whole
stack end-to-end: a DB-backed resource served by Nest and rendered by Next.

## Decisions (locked with user)

- Architecture: **Hybrid** — Nest.js on Railway, Next.js on Vercel, shared Neon Postgres.
- Repo: **full pnpm workspace monorepo** (`apps/web` + `apps/api` + `packages/shared`).
- First slice: **health check + one DB-backed resource (`items`) + Next.js fetching it.**
- ORM: **Prisma** (first-class Neon support, migrations, type-safety).
- Local DB: **dockerized Postgres** (offline dev); **Neon** for deployed.
- The user performs all cloud provisioning (Neon, Railway, Vercel settings) via a
  runbook; the assistant writes all code/config and guides each click.

## Target structure

```
nextjs-boilerplate/                 (git root — becomes the workspace root)
├─ apps/
│  ├─ web/                          Next.js portfolio (MOVED here) → Vercel
│  │  └─ app/ components/ content/ lib/ public/ next.config.ts …
│  └─ api/                          NEW Nest.js → Railway
│     ├─ src/
│     │  ├─ main.ts                 bootstrap; CORS; global /api prefix; PORT
│     │  ├─ app.module.ts
│     │  ├─ prisma/                 PrismaModule + PrismaService
│     │  ├─ health/                 GET /api/health
│     │  └─ items/                  GET/POST /api/items (controller+service)
│     ├─ prisma/schema.prisma       Item model; migrations/
│     ├─ Dockerfile                 workspace-aware build (root context)
│     └─ package.json
├─ packages/
│  └─ shared/                       @repo/shared — shared TS types/DTOs (built)
├─ docker-compose.yml               local Postgres for dev
├─ pnpm-workspace.yaml
├─ package.json                     workspace root (private; dev/build scripts)
├─ AGENTS.md CLAUDE.md README.md    stay at root
```

## Package manager & workspace

Switch from npm to **pnpm** (already installed, v10). `pnpm-workspace.yaml` lists
`apps/*` and `packages/*`. Root `package.json` is private with orchestration
scripts (`dev`, `build`, `lint`) that fan out with `pnpm -r` / `--parallel`.
Delete `package-lock.json`, add `pnpm-lock.yaml`, set `"packageManager": "pnpm@10.x"`.

## apps/web (moved Next.js)

Move the existing app wholesale into `apps/web/`. The `@/*` → `./*` alias in
`tsconfig.json` stays valid (paths are app-relative). Add `@repo/shared` as a
workspace dependency and use its types where the frontend consumes API data.
New env: `NEXT_PUBLIC_API_URL` (Railway URL in prod, `http://localhost:3001` in dev).

**Live-deploy impact:** the Vercel project's **Root Directory must change to
`apps/web`** (a dashboard setting the user updates). Until that's set, a redeploy
would fail — so the sequence below changes Vercel settings *before* pushing.

## apps/api (Nest.js + Prisma)

- Nest app, `app.setGlobalPrefix('api')`, listens on `process.env.PORT ?? 3001`.
- **CORS** allows the web origin(s) from an env allowlist (`WEB_ORIGIN`).
- `PrismaService` (Nest injectable) manages the client lifecycle.
- `health`: `GET /api/health` → `{ status, db: ok/faildb-check }`.
- `items`: `GET /api/items`, `POST /api/items` backed by an `Item` Prisma model
  (`id`, `title`, `createdAt`). Migrations committed; a small seed script.
- Prisma uses **`DATABASE_URL` (pooled)** at runtime and **`DIRECT_URL`** for
  migrations, per Neon guidance.

## packages/shared

`@repo/shared` exports the shared `Item` DTO/type (and a validation schema) used
by both apps. Built with `tsc` → `dist` (types + JS), so both apps consume a
compiled package (no `transpilePackages`/rootDir friction). Build order is
enforced topologically (shared builds before web/api).

## Database

- **Local:** `docker-compose.yml` runs Postgres 16; `DATABASE_URL`/`DIRECT_URL`
  point at it. `prisma migrate dev` + seed run against local.
- **Deployed:** Neon Postgres. Connection strings live on **Railway** (the API),
  **not** Vercel. `prisma migrate deploy` runs on Railway at release.

## Local dev workflow

```
docker compose up -d           # local Postgres
pnpm install
pnpm --filter @repo/shared build
pnpm --filter api prisma migrate dev
pnpm dev                       # web :3000 + api :3001 in parallel
```

## Deployment

- **Neon:** create a Postgres DB (via Vercel Marketplace *or* directly at neon.tech).
  Copy the pooled + direct connection strings.
- **Railway:** new project from the GitHub repo → service builds `apps/api/Dockerfile`
  (root build context). Env: `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGIN`. Start
  command runs `prisma migrate deploy` then `node dist/main.js`. Railway provides `PORT`.
- **Vercel:** set project **Root Directory = `apps/web`**; add `NEXT_PUBLIC_API_URL`
  = the Railway public URL. Redeploy.

## Risks / callouts

- **Live portfolio churn:** moving `web` + changing Vercel root dir can break the
  deploy if mis-sequenced. Mitigation: update Vercel settings first; verify a
  preview deploy before promoting.
- **Railway + pnpm monorepo builds** are the fiddliest step → solved with a
  Dockerfile using the repo root as context (deterministic, no Nixpacks guesswork).
- **Cloud steps need the user** (accounts, integrations, terms, secrets). The
  assistant cannot provision these; delivers code + a click-by-click runbook.
- Costs: Neon has a free tier (scale-to-zero); Railway has a small usage-based
  cost for an always-on service.

## Verification

- Local: `docker compose up`, `pnpm dev`, hit `GET localhost:3001/api/health` and
  `/api/items`; load the web page that lists items; `POST` an item and see it appear.
- Types: `pnpm -r build` (web + api + shared) and `pnpm -r lint` pass.
- Deployed: Railway `/api/health` green; Vercel page fetches live items from Railway;
  CORS allows the Vercel origin only.

## Out of scope (future slices)

Auth, the real Financial Dashboard data model, the "Ask About Alek" MCP endpoint,
Turborepo/remote caching. Each is its own follow-up.
```
