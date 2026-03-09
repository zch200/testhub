import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { getDbPath, getMigrationsDir } from "./paths";

/** 在指定的 better-sqlite3 Database 实例上执行 migrations */
export function runMigrationsOnDb(db: InstanceType<typeof Database>): void {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationsDir = getMigrationsDir();
  const rows = db.prepare("SELECT name FROM __migrations").all() as Array<{ name: string }>;
  const applied = new Set(rows.map((row) => row.name));

  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    if (applied.has(file)) {
      continue;
    }

    const sql = readFileSync(`${migrationsDir}/${file}`, "utf8");
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO __migrations(name, applied_at) VALUES(?, ?)").run(file, now);
    });

    tx();
    // eslint-disable-next-line no-console
    console.log(`Applied migration: ${file}`);
  }
}

/** 生产环境：打开本地 DB 文件，跑 migrations 后关闭 */
export function runMigrations(): void {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  runMigrationsOnDb(db);

  db.close();
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations();
}
