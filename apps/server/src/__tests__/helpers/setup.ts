import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { FastifyInstance } from "fastify";
import * as schema from "../../db/schema";
import { setDb, resetDb } from "../../db";
import { runMigrationsOnDb } from "../../db/migrate";
import { buildApp } from "../../app";

const TEST_TOKEN = process.env.TESTHUB_API_TOKEN ?? "test-token-for-integration";

interface TestApp {
  app: FastifyInstance;
  sqliteDb: InstanceType<typeof Database>;
}

/** 创建完整的测试应用：内存 DB + migrations + Fastify 实例 */
export async function createTestApp(): Promise<TestApp> {
  const sqliteDb = new Database(":memory:");
  sqliteDb.pragma("foreign_keys = ON");

  runMigrationsOnDb(sqliteDb);

  const testDb = drizzle(sqliteDb, { schema });
  setDb(testDb);

  const app = buildApp({ logger: false });
  await app.ready();

  return { app, sqliteDb };
}

/** 清理测试应用 */
export async function destroyTestApp(app: FastifyInstance, sqliteDb: InstanceType<typeof Database>): Promise<void> {
  await app.close();
  sqliteDb.close();
  resetDb();
}

/** 返回带认证 token 的请求头 */
export function authHeaders(): Record<string, string> {
  return { "x-testhub-token": TEST_TOKEN };
}

/** 创建种子项目，返回创建的项目数据 */
export async function createSeedProject(
  app: FastifyInstance,
  data: { name: string; description?: string } = { name: "测试项目" }
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: authHeaders(),
    payload: data,
  });
  return res.json();
}

/** 创建种子用例库，返回创建的库数据 */
export async function createSeedLibrary(
  app: FastifyInstance,
  projectId: number,
  data: { name: string; code: string; description?: string } = { name: "测试库", code: "TEST" }
) {
  const res = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/libraries`,
    headers: authHeaders(),
    payload: data,
  });
  return res.json();
}
