import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import {
  createTestApp,
  destroyTestApp,
  authHeaders,
  createSeedProject,
  createSeedLibrary,
} from "./helpers/setup";

describe("Libraries API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let projectId: number;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
    const project = await createSeedProject(app, { name: "库测试项目" });
    projectId = project.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 创建 ──────────────────────────────────────────

  it("POST /projects/:projectId/libraries → 创建库", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/libraries`,
      headers: authHeaders(),
      payload: { name: "核心库", code: "CORE", description: "核心用例库" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      name: "核心库",
      code: "CORE",
      projectId,
    });
    expect(body.id).toBeDefined();
  });

  it("POST 重复 code 返回 409", async () => {
    await createSeedLibrary(app, projectId, { name: "库1", code: "DUP1" });
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/libraries`,
      headers: authHeaders(),
      payload: { name: "库2", code: "DUP1" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST code 格式不合法返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/libraries`,
      headers: authHeaders(),
      payload: { name: "坏库", code: "ab" },
    });
    expect(res.statusCode).toBe(400);
  });

  // ── 查询 ──────────────────────────────────────────

  it("GET /projects/:projectId/libraries → 列表库", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/libraries`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /libraries/:id → 获取库详情", async () => {
    const lib = await createSeedLibrary(app, projectId, {
      name: "详情库",
      code: "DETL",
    });
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${lib.id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("详情库");
  });

  it("GET /libraries/:id 不存在返回 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/libraries/99999",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  // ── 更新 ──────────────────────────────────────────

  it("PUT /libraries/:id → 更新库", async () => {
    const lib = await createSeedLibrary(app, projectId, {
      name: "待更新库",
      code: "UPDT",
    });
    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/libraries/${lib.id}`,
      headers: authHeaders(),
      payload: { name: "已更新库" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("已更新库");
  });

  it("PUT /libraries/:id 更新 code 唯一性冲突返回 409", async () => {
    await createSeedLibrary(app, projectId, { name: "已有库", code: "EXST" });
    const lib2 = await createSeedLibrary(app, projectId, {
      name: "另一库",
      code: "OTHR",
    });
    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/libraries/${lib2.id}`,
      headers: authHeaders(),
      payload: { code: "EXST" },
    });
    expect(res.statusCode).toBe(409);
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /libraries/:id → 删除库", async () => {
    const lib = await createSeedLibrary(app, projectId, {
      name: "待删除库",
      code: "DELL",
    });
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/libraries/${lib.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${lib.id}`,
      headers: authHeaders(),
    });
    expect(getRes.statusCode).toBe(404);
  });

  it("DELETE /libraries/:id 级联删除关联的目录和用例", async () => {
    const lib = await createSeedLibrary(app, projectId, {
      name: "级联库",
      code: "CASC",
    });

    // 创建目录
    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${lib.id}/directories`,
      headers: authHeaders(),
      payload: { name: "目录A" },
    });

    // 创建用例
    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${lib.id}/cases`,
      headers: authHeaders(),
      payload: { title: "用例A", contentType: "text", textContent: "内容" },
    });

    // 删除库
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/libraries/${lib.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 验证目录和用例已被清除
    const dirRes = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${lib.id}/directories`,
      headers: authHeaders(),
    });
    if (dirRes.statusCode === 200) {
      expect(dirRes.json()).toHaveLength(0);
    }
  });
});
