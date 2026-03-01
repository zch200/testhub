import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, "migrations");
const dataDir = join(__dirname, "../../data");
const dbPath = join(dataDir, "testhub.db");

export function runMigrations(): void {
  mkdirSync(dataDir, { recursive: true });
  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const rows = db.prepare("SELECT name FROM __migrations").all() as Array<{ name: string }>;
  const applied = new Set(rows.map((row) => row.name));

  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    if (applied.has(file)) {
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO __migrations(name, applied_at) VALUES(?, ?)").run(file, now);
    });

    tx();
    // eslint-disable-next-line no-console
    console.log(`Applied migration: ${file}`);
  }

  db.close();
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations();
}
