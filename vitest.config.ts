import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "shared",
          environment: "node",
          include: ["packages/shared/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "api",
          environment: "node",
          include: ["apps/api/src/**/*.test.ts"],
        },
      },
      {
        // root = apps/web so React/JSX resolve from the web package's own
        // node_modules (pnpm isolates them there, not at the repo root).
        root: fileURLToPath(new URL("./apps/web", import.meta.url)),
        plugins: [react()],
        resolve: {
          alias: {
            // Mirrors apps/web tsconfig paths: "@/*" -> "./*"
            "@": fileURLToPath(new URL("./apps/web", import.meta.url)),
          },
        },
        test: {
          name: "web",
          environment: "jsdom",
          include: ["**/*.test.tsx", "**/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
