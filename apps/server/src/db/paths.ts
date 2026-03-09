import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultDataDir = join(__dirname, "../../data");
const defaultDbFile = "testhub.db";

export function getDbPath(): string {
  const envPath = process.env.TESTHUB_DB_PATH?.trim();
  if (envPath) {
    return isAbsolute(envPath) ? envPath : join(defaultDataDir, envPath);
  }
  return join(defaultDataDir, defaultDbFile);
}

export function getMigrationsDir(): string {
  return join(__dirname, "migrations");
}
