import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import {
  createTestApp,
  destroyTestApp,
  authHeaders,
  createSeedProject,
} from "./helpers/setup";

describe("Projects API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 认证 ──────────────────────────────────────────

  it("无 token 返回 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
    });
    expect(res.statusCode).toBe(401);
  });

  // ── 创建 ──────────────────────────────────────────

  it("POST /projects → 创建项目", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: authHeaders(),
      payload: { name: "项目A", description: "描述A" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ name: "项目A", description: "描述A" });
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });

  it("POST /projects 缺少 name 返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: authHeaders(),
      payload: { description: "只有描述" },
    });
    expect(res.statusCode).toBe(400);
  });

  // ── 查询 ──────────────────────────────────────────

  it("GET /projects → 列表项目（分页）", async () => {
    // 先创建几个项目
    await createSeedProject(app, { name: "列表项目1" });
    await createSeedProject(app, { name: "列表项目2" });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/projects?page=1&pageSize=10",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    expect(body.total).toBeGreaterThanOrEqual(2);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
  });

  it("GET /projects 支持排序", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/projects?sortBy=name&sortOrder=asc",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const names = body.items.map((p: { name: string }) => p.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("GET /projects/:id → 获取项目详情", async () => {
    const project = await createSeedProject(app, { name: "详情项目" });
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("详情项目");
  });

  it("GET /projects/:id 不存在返回 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/projects/99999",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  // ── 更新 ──────────────────────────────────────────

  it("PUT /projects/:id → 更新项目", async () => {
    const project = await createSeedProject(app, { name: "待更新" });
    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
      payload: { name: "已更新", description: "新描述" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ name: "已更新", description: "新描述" });
  });

  it("PUT /projects/:id 部分更新只改 name", async () => {
    const project = await createSeedProject(app, {
      name: "原名",
      description: "原描述",
    });
    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
      payload: { name: "新名" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe("新名");
    expect(body.description).toBe("原描述");
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /projects/:id → 删除项目", async () => {
    const project = await createSeedProject(app, { name: "待删除" });
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 验证已删除
    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
    });
    expect(getRes.statusCode).toBe(404);
  });

  it("DELETE /projects/:id 级联删除关联的库", async () => {
    const project = await createSeedProject(app, { name: "级联项目" });

    // 创建一个关联的库
    await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/libraries`,
      headers: authHeaders(),
      payload: { name: "库A", code: "LIBA" },
    });

    // 删除项目
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 列表该项目的库应为空或404
    const libRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/libraries`,
      headers: authHeaders(),
    });
    // 项目已删除，库也应不存在
    const body = libRes.json();
    if (libRes.statusCode === 200) {
      expect(body.items).toHaveLength(0);
    }
  });
});
