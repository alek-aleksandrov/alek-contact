# Nest.js API image for the pnpm monorepo.
# IMPORTANT: build context is the REPO ROOT, not apps/api:
#   docker build -f apps/api/Dockerfile -t alek-api .
# (Render/Railway do this automatically when you point them at this Dockerfile.)

FROM node:22-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# ---- build stage: install workspace + compile shared and api ----
FROM base AS build
COPY . .
# Install only the api and its workspace deps (keeps Next/web out of the image).
RUN pnpm install --frozen-lockfile --filter "api..."
RUN pnpm --filter @repo/shared build && pnpm --filter api build

# ---- runtime stage ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
# ENTRYPOINT runs migrations on every start and then execs the CMD. Because the
# migrate step lives in ENTRYPOINT (not CMD), it still runs even if the host
# (Railway/Render) overrides the start command — the override just replaces CMD,
# which the entrypoint execs after migrating.
ENTRYPOINT ["sh", "/repo/apps/api/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
