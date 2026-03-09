import { buildApp } from "./app";
import { runMigrations } from "./db/migrate";
import { getApiToken, getBootId } from "./utils/auth";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 4010);

async function start() {
  runMigrations();

  const app = buildApp();
  const token = getApiToken();
  const bootId = getBootId();

  try {
    await app.listen({ host, port });
    const base = `http://${host}:${port}`;
    app.log.info(`TestHub server running at ${base}`);
    app.log.info(`Swagger docs: ${base}/api/docs`);
    app.log.info(`Agent skill guide: ${base}/skill.md`);
    app.log.info(`API token (copy to scripts): ${token}`);
    app.log.info(`Boot ID: ${bootId}`);

    // Self-check: verify OpenAPI spec is accessible
    const specRes = await app.inject({ method: "GET", url: "/api/docs/json" });
    if (specRes.statusCode === 200) {
      const spec = JSON.parse(specRes.body);
      const pathCount = Object.keys(spec.paths ?? {}).length;
      app.log.info(`OpenAPI spec OK — ${pathCount} paths registered`);
    } else {
      app.log.warn(`OpenAPI spec check failed (HTTP ${specRes.statusCode})`);
    }
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
