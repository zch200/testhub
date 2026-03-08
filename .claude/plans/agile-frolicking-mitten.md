# 后端 API 集成测试搭建计划

## Context

TestHub 项目当前零测试基础设施。后端采用 Fastify + Drizzle + better-sqlite3 的 service 层架构，路由清晰、业务逻辑集中在 services/ 下。需要搭建 API 集成测试，用 Fastify `inject()` 做无端口请求，`:memory:` SQLite 做数据隔离，覆盖核心 CRUD 与级联逻辑。

## 核心挑战

所有 service 文件通过 `import { db } from "../db"` 引用一个**模块级单例** DB 实例。测试需要每个 test suite 使用独立的内存数据库，因此必须把 `db` 改为可替换的。

## 实施步骤

### Step 1: 安装依赖 ✅

在 `apps/server` 安装 vitest：

```bash
pnpm --filter @testhub/server add -D vitest
```

### Step 2: 重构 DB 模块支持测试注入 ✅

**修改文件**: `apps/server/src/db/index.ts`

将 `db` 从模块顶层初始化的常量，改为延迟初始化 + 可替换模式：

```typescript
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
```

**关键设计**: 使用 `Proxy` 让现有的 `import { db }` 全部无需修改，但底层实例可通过 `setDb()` 替换。

### Step 3: 重构 migrate.ts 支持传入 DB 实例 ✅

**修改文件**: `apps/server/src/db/migrate.ts`

```typescript
// 新增重载：接受一个 better-sqlite3 Database 实例
export function runMigrationsOnDb(sqliteDb: Database): void {
  // 复用现有逻辑，但操作传入的 db 而非新建
}

// 保留原有 runMigrations() 不变（生产用）
```

### Step 4: 创建测试辅助工具 ✅

**新建文件**: `apps/server/src/__tests__/helpers/setup.ts`

功能：
- `createTestApp()`: 创建内存 SQLite → 跑 migrations → `setDb()` 注入 → `buildApp()` → 返回 `{ app, sqliteDb }`
- `destroyTestApp()`: `app.close()` + `sqliteDb.close()` + `resetDb()`
- `authHeaders()`: 返回带 `x-testhub-token` 的 headers（利用 `TESTHUB_API_TOKEN` 环境变量）
- `createSeedProject()` / `createSeedLibrary()` 等常用数据工厂函数

Auth 处理：在 `vitest.config.ts` 的 `env` 中设置 `TESTHUB_API_TOKEN=test-token`，auth 模块会优先读环境变量，无需 mock。但因为 auth 模块内有 `runtimeToken` 缓存，需要在每个测试 suite 前重置。方案：在 setup helper 中通过动态 import + 模块状态处理。

### Step 5: 添加 Vitest 配置 ✅

**新建文件**: `apps/server/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      TESTHUB_API_TOKEN: "test-token-for-integration",
    },
    // 每个文件独立 worker，避免 DB 单例冲突
    pool: "forks",
    poolOptions: {
      forks: { singleFork: false },
    },
  },
});
```

### Step 6: 编写 API 集成测试 ✅

**新建测试文件（按资源分文件）**:

| 文件 | 覆盖内容 |
|------|----------|
| `src/__tests__/projects.test.ts` | CRUD 全流程、分页、排序、级联删除 |
| `src/__tests__/libraries.test.ts` | CRUD、project 关联、unique(projectId+code)、级联删除 |
| `src/__tests__/directories.test.ts` | 树结构 CRUD、父子关系、排序 |
| `src/__tests__/cases.test.ts` | CRUD、批量创建、内容类型(text/step)、优先级筛选、版本管理 |
| `src/__tests__/tags.test.ts` | CRUD、unique(libraryId+name)、关联用例 |
| `src/__tests__/plans.test.ts` | CRUD、状态流转 |
| `src/__tests__/plan-cases.test.ts` | 添加/移除用例、执行状态更新、统计、批量操作 |

每个测试文件结构：

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, destroyTestApp, authHeaders } from "./helpers/setup";

describe("Projects API", () => {
  let app: FastifyInstance;
  let sqliteDb: Database;

  beforeEach(async () => {
    ({ app, sqliteDb } = await createTestApp());
  });

  afterEach(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  it("POST /api/v1/projects → 创建项目", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: authHeaders(),
      payload: { name: "测试项目", description: "描述" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ name: "测试项目" });
  });

  // ... 更多测试
});
```

### Step 7: 集成到 Turborepo & package.json ✅

**修改 `apps/server/package.json`**: 添加 scripts

```json
"test": "vitest run",
"test:watch": "vitest"
```

**修改 `turbo.json`**: 添加 test task

```json
"test": {
  "dependsOn": ["^build"],
  "outputs": []
}
```

**修改根 `package.json`**: 添加全局脚本

```json
"test": "turbo run test"
```

### Step 8: 更新 CLAUDE.md ✅

在常用命令中补充 `pnpm test` 和 `pnpm test:watch`。

## 涉及文件清单

| 操作 | 文件 |
|------|------|
| 修改 | `apps/server/src/db/index.ts` — DB 单例改为可注入 |
| 修改 | `apps/server/src/db/migrate.ts` — 支持传入 DB 实例 |
| 新建 | `apps/server/vitest.config.ts` |
| 新建 | `apps/server/src/__tests__/helpers/setup.ts` |
| 新建 | `apps/server/src/__tests__/projects.test.ts` |
| 新建 | `apps/server/src/__tests__/libraries.test.ts` |
| 新建 | `apps/server/src/__tests__/directories.test.ts` |
| 新建 | `apps/server/src/__tests__/cases.test.ts` |
| 新建 | `apps/server/src/__tests__/tags.test.ts` |
| 新建 | `apps/server/src/__tests__/plans.test.ts` |
| 新建 | `apps/server/src/__tests__/plan-cases.test.ts` |
| 修改 | `apps/server/package.json` — 添加 vitest 依赖和 test 脚本 |
| 修改 | `turbo.json` — 添加 test task |
| 修改 | `package.json`（根）— 添加 pnpm test |
| 修改 | `CLAUDE.md` — 补充测试命令说明 |

## 验证方式

1. `pnpm --filter @testhub/server test` — 所有测试通过
2. `pnpm typecheck` — 类型检查通过（确认 Proxy 导出和新接口类型正确）
3. `pnpm build` — 构建通过
4. `pnpm dev` 启动后手动操作一遍 — 确认 DB 重构没有影响生产行为
