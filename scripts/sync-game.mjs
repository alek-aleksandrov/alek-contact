#!/usr/bin/env node
/*
 * Sync the "Application Denied" WASM game build into the portfolio.
 *
 *   node scripts/sync-game.mjs <path-to-game-repo>
 *   GAME_REPO=/path/to/repo node scripts/sync-game.mjs
 *
 * Copies the game's built web/ output into apps/web/public/game/ and rewrites
 * the copied index.html so it serves correctly under the /game route:
 *   - relative src/href refs and the wasm fetch become absolute /game/… paths
 *     (so it works regardless of trailing slash / the /game rewrite),
 *   - a "← Portfolio" link is injected so players can leave the immersive page.
 *
 * The game binary (main.wasm) is committed to the portfolio: Vercel has no Go
 * toolchain, so it cannot be built at deploy time. Re-run this whenever the
 * game changes to refresh the vendored build.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "apps/web/public/game");

const gameRepo = process.argv[2] || process.env.GAME_REPO;
if (!gameRepo) {
  console.error(
    "Usage: node scripts/sync-game.mjs <path-to-game-repo>  (or set GAME_REPO)",
  );
  process.exit(1);
}
const webDir = path.join(gameRepo, "web");

// 1. Rebuild the WASM if the Go toolchain is available; otherwise fall back to
//    whatever is already built in web/.
try {
  execFileSync("make", ["build"], { cwd: gameRepo, stdio: "inherit" });
} catch {
  console.warn(
    "⚠  `make build` failed or Go is unavailable — copying the existing web/ artifacts.",
  );
}

// 2. Copy every built asset into public/game/ (auto-includes new JS files).
mkdirSync(dest, { recursive: true });
for (const file of readdirSync(webDir)) {
  cpSync(path.join(webDir, file), path.join(dest, file));
}

// 3. Rewrite index.html for the /game route.
const indexPath = path.join(dest, "index.html");
let html = readFileSync(indexPath, "utf8");

// Absolute-ize relative src/href refs (skip absolute / remote / data / anchor).
html = html.replace(
  /(src|href)="(?!\/|https?:|data:|#)([^"]+)"/g,
  '$1="/game/$2"',
);
// Absolute-ize the wasm fetch.
html = html.replace(
  /fetch\("(?!\/|https?:)([^"]+\.wasm)"\)/g,
  'fetch("/game/$1")',
);
// Inject a link back to the project's detail page (idempotent).
if (!html.includes("data-back-to-portfolio")) {
  const backLink =
    '<a data-back-to-portfolio href="/projects/application-denied" ' +
    'style="position:fixed;bottom:14px;left:14px;z-index:9999;' +
    "font:600 12px system-ui,-apple-system,sans-serif;color:#fff;" +
    "background:rgba(20,20,22,.72);padding:7px 13px;border-radius:9px;" +
    'text-decoration:none;backdrop-filter:blur(6px)">← Back to project</a>';
  html = html.replace("</body>", `${backLink}\n</body>`);
}

writeFileSync(indexPath, html);
console.log(`✓ Synced game → ${path.relative(root, dest)}`);
