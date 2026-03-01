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
    app.log.info(`TestHub server running at http://${host}:${port}`);
    app.log.info(`Swagger docs: http://${host}:${port}/api/docs`);
    app.log.info(`API token (copy to scripts): ${token}`);
    app.log.info(`Boot ID: ${bootId}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
