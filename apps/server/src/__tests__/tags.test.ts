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

describe("Tags API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let libraryId: number;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
    const project = await createSeedProject(app, { name: "标签测试项目" });
    const lib = await createSeedLibrary(app, project.id, {
      name: "标签测试库",
      code: "TAGS",
    });
    libraryId = lib.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 创建 ──────────────────────────────────────────

  it("POST /libraries/:libraryId/tags → 创建标签", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
      payload: { name: "冒烟测试" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ name: "冒烟测试", libraryId });
    expect(body.id).toBeDefined();
  });

  it("POST 同库重复标签名返回 409", async () => {
    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
      payload: { name: "唯一标签" },
    });
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
      payload: { name: "唯一标签" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST 缺少 name 返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  // ── 查询 ──────────────────────────────────────────

  it("GET /libraries/:libraryId/tags → 列表标签", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("GET 支持按名称排序", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/tags?sortBy=name&sortOrder=asc`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const names = res
      .json()
      .items.map((t: { name: string }) => t.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /tags/:id → 删除标签", async () => {
    const tag = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/tags`,
        headers: authHeaders(),
        payload: { name: "待删标签" },
      })
      .then((r) => r.json());

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/tags/${tag.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 验证标签列表中不再有该标签
    const listRes = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/tags`,
      headers: authHeaders(),
    });
    const names = listRes
      .json()
      .items.map((t: { name: string }) => t.name);
    expect(names).not.toContain("待删标签");
  });

  // ── 标签与用例关联 ────────────────────────────────

  it("通过用例创建关联标签，删除标签后用例不受影响", async () => {
    // 创建带标签的用例
    const caseRes = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: {
          title: "标签关联用例",
          contentType: "text",
          textContent: "内容",
          tags: ["关联标签"],
        },
      })
      .then((r) => r.json());

    expect(caseRes.tags).toHaveLength(1);

    // 找到该标签 ID
    const tagsRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/libraries/${libraryId}/tags`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const tag = tagsRes.items.find(
      (t: { name: string }) => t.name === "关联标签"
    );

    // 删除标签
    await app.inject({
      method: "DELETE",
      url: `/api/v1/tags/${tag.id}`,
      headers: authHeaders(),
    });

    // 用例仍然存在
    const caseDetail = await app
      .inject({
        method: "GET",
        url: `/api/v1/cases/${caseRes.id}`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    expect(caseDetail.id).toBe(caseRes.id);
    // 标签关联已被移除
    expect(caseDetail.tags).toHaveLength(0);
  });
});
