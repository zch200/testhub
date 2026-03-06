import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type DbInstance = BetterSQLite3Database<typeof schema>;

let _db: DbInstance | null = null;

/** 生产环境延迟初始化 */
function createDefaultDb(): DbInstance {
  const dataDir = join(__dirname, "../../data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = join(dataDir, "testhub.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/** 获取 DB 实例（延迟初始化） */
export function getDb(): DbInstance {
  if (!_db) {
    _db = createDefaultDb();
  }
  return _db;
}

/** 测试用：注入自定义 DB 实例 */
export function setDb(instance: DbInstance): void {
  _db = instance;
}

/** 测试用：重置为 null，下次 getDb() 会重新初始化 */
export function resetDb(): void {
  _db = null;
}

/**
 * 向后兼容的 db 导出 — 通过 getter 代理到 getDb()
 * 这样所有 `import { db } from "../db"` 无需修改
 */
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
