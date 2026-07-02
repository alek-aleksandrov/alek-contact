# Alek Portfolio — monorepo

Personal portfolio and full-stack playground of **Aleksandar Aleksandrov**.

A **pnpm workspace** with two deploy targets and a shared package:

```
apps/
  web/        Next.js 16 portfolio (React 19, Tailwind v4, shadcn/ui, Motion)  → Vercel
  api/        Nest.js API (Prisma + Postgres)                                  → Render
packages/
  shared/     @repo/shared — TypeScript types shared by web + api
```

The frontend is a content-driven portfolio; the backend is a real Nest.js service
demonstrating a full-stack slice (see the **/lab** page — a live list served by
Nest, stored in Postgres, with the `Item` type shared across both sides).

## Quick start

```bash
pnpm install
pnpm db:up                                    # local Postgres in Docker
cp apps/api/.env.example apps/api/.env        # local DB URLs
pnpm --filter api exec prisma migrate dev     # create tables
pnpm --filter api exec ts-node prisma/seed.ts # optional seed
pnpm dev                                       # web :3000  +  api :3001
```

Open [localhost:3000](http://localhost:3000) (and `/lab` for the full-stack demo).

## Scripts (run from the repo root)

- `pnpm dev` — build shared, then run web + api together
- `pnpm build` — build every package (`pnpm -r build`)
- `pnpm lint` — lint every package
- `pnpm db:up` / `pnpm db:down` — start/stop the local Postgres

## Architecture & deployment

- Content model & frontend conventions: the web app renders from typed modules in
  `apps/web/content/`.
- **Deploying** (Neon + Render + Vercel): see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- Design rationale: [`docs/specs/2026-07-02-backend-monorepo-neon-railway-design.md`](docs/specs/2026-07-02-backend-monorepo-neon-railway-design.md).

Add your resume at `apps/web/public/alek-resume.pdf` to wire up the Resume link.
