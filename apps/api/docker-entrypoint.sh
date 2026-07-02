#!/bin/sh
# Runs on every container start (via Docker ENTRYPOINT), so it survives even if
# the host overrides the start command. Applies any pending Prisma migrations,
# then execs the actual app command (the Dockerfile CMD, or the host's override).
set -e

cd /repo/apps/api

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
pnpm exec prisma migrate deploy

echo "[entrypoint] Migrations up to date. Starting: $*"
exec "$@"
