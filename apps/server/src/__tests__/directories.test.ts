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

describe("Directories API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let libraryId: number;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
    const project = await createSeedProject(app, { name: "目录测试项目" });
    const lib = await createSeedLibrary(app, project.id, {
      name: "目录测试库",
      code: "DIRT",
    });
    libraryId = lib.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 创建 ──────────────────────────────────────────

  it("POST /libraries/:libraryId/directories → 创建根目录", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/directories`,
      headers: authHeaders(),
      payload: { name: "根目录A" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ name: "根目录A", libraryId });
    expect(body.parentId).toBeNull();
  });

  it("POST → 创建子目录", async () => {
    const parent = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "父目录" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/directories`,
      headers: authHeaders(),
      payload: { name: "子目录", parentId: parent.id },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().parentId).toBe(parent.id);
  });

  it("POST 指定 sortOrder", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/directories`,
      headers: authHeaders(),
      payload: { name: "排序目录", sortOrder: 5 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().sortOrder).toBe(5);
  });

  // ── 树形查询 ──────────────────────────────────────

  it("GET /libraries/:libraryId/directories → 返回树形结构", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/directories`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const tree = res.json();
    expect(tree).toBeInstanceOf(Array);
    // 树的根节点应该有 children 属性
    const nodeWithChildren = tree.find(
      (n: { children: unknown[] }) => n.children && n.children.length > 0
    );
    if (nodeWithChildren) {
      expect(nodeWithChildren.children[0].parentId).toBe(nodeWithChildren.id);
    }
  });

  // ── 单个查询 ──────────────────────────────────────

  it("GET /directories/:id → 获取目录详情", async () => {
    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "详情目录" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/directories/${dir.id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("详情目录");
  });

  it("GET /directories/:id 不存在返回 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/directories/99999",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  // ── 更新 ──────────────────────────────────────────

  it("PUT /directories/:id → 更新目录名称", async () => {
    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "旧名" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/directories/${dir.id}`,
      headers: authHeaders(),
      payload: { name: "新名" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("新名");
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /directories/:id → 删除目录", async () => {
    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "待删目录" },
      })
      .then((r) => r.json());

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/directories/${dir.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/directories/${dir.id}`,
      headers: authHeaders(),
    });
    expect(getRes.statusCode).toBe(404);
  });

  it("DELETE /directories/:id?caseMoveTo=uncategorized 用例迁移到未分类", async () => {
    // 创建目录
    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "含用例目录" },
      })
      .then((r) => r.json());

    // 在目录下创建用例
    const caseRes = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: {
          title: "目录用例",
          directoryId: dir.id,
          contentType: "text",
          textContent: "内容",
        },
      })
      .then((r) => r.json());

    // 删除目录，用例迁移到未分类
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/directories/${dir.id}?caseMoveTo=uncategorized`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 用例的 directoryId 应变为 null
    const caseDetail = await app
      .inject({
        method: "GET",
        url: `/api/v1/cases/${caseRes.id}`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    expect(caseDetail.directoryId).toBeNull();
  });
});
