import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUNDLED = process.env.TESTHUB_BUNDLED === "1";

export function getDataDir(): string {
  const envDir = process.env.TESTHUB_DATA_DIR?.trim();
  if (envDir) {
    return envDir;
  }
  if (BUNDLED) {
    return join(homedir(), ".testhub");
  }
  return join(__dirname, "../../data");
}

export function getDbPath(): string {
  const envPath = process.env.TESTHUB_DB_PATH?.trim();
  if (envPath) {
    return isAbsolute(envPath) ? envPath : join(getDataDir(), envPath);
  }
  return join(getDataDir(), "testhub.db");
}

export function getMigrationsDir(): string {
  return join(__dirname, "migrations");
}
