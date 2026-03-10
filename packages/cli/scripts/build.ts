import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const OUT = resolve(__dirname, "../dist");

async function main() {
  // Clean previous build
  if (existsSync(OUT)) {
    rmSync(OUT, { recursive: true });
  }
  mkdirSync(OUT, { recursive: true });

  // 1. esbuild: bundle server + shared into a single JS file
  await build({
    entryPoints: [resolve(ROOT, "apps/server/src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile: resolve(OUT, "bin.mjs"),
    banner: {
      js: [
        "#!/usr/bin/env node",
        'import { createRequire as __createRequire } from "node:module";',
        'import { fileURLToPath as __fileURLToPath } from "node:url";',
        'import { dirname as __pathDirname } from "node:path";',
        "var require = __createRequire(import.meta.url);",
        "var __filename = __fileURLToPath(import.meta.url);",
        "var __dirname = __pathDirname(__filename);",
      ].join("\n"),
    },
    external: ["better-sqlite3", "@fastify/swagger-ui"],
    define: {
      "process.env.TESTHUB_BUNDLED": '"1"',
    },
  });

  // 2. Copy SQL migrations
  const migrationsSource = resolve(ROOT, "apps/server/src/db/migrations");
  cpSync(migrationsSource, resolve(OUT, "migrations"), { recursive: true });

  // 3. Copy frontend static files (built by @testhub/web)
  const publicSource = resolve(ROOT, "apps/server/public");
  if (existsSync(publicSource)) {
    cpSync(publicSource, resolve(OUT, "public"), { recursive: true });
  } else {
    console.warn("⚠ apps/server/public not found — run 'pnpm build' for web first");
  }

  // 4. Copy SKILL.md
  const skillSource = resolve(ROOT, "docs/SKILL.md");
  if (existsSync(skillSource)) {
    cpSync(skillSource, resolve(OUT, "SKILL.md"));
  }

  console.log("✓ CLI package built successfully → packages/cli/dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
