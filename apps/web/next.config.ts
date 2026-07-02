import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root (two levels up from apps/web) so Turbopack resolves
  // the pnpm monorepo root correctly and doesn't mis-detect from a stray
  // lockfile higher up the filesystem.
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
};

export default nextConfig;
