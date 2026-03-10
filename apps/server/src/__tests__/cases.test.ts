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

describe("Cases API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let libraryId: number;
  let directoryId: number;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
    const project = await createSeedProject(app, { name: "用例测试项目" });
    const lib = await createSeedLibrary(app, project.id, {
      name: "用例测试库",
      code: "CASE",
    });
    libraryId = lib.id;

    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "用例目录" },
      })
      .then((r) => r.json());
    directoryId = dir.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 创建（text 类型） ──────────────────────────────

  it("POST /libraries/:libraryId/cases → 创建 text 用例", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "文本用例",
        contentType: "text",
        textContent: "测试内容",
        textExpected: "期望结果",
        priority: "P0",
        caseType: "functional",
        directoryId,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      title: "文本用例",
      contentType: "text",
      priority: "P0",
      libraryId,
      directoryId,
    });
    expect(body.id).toBeDefined();
    expect(body.latestVersionNo).toBe(1);
  });

  // ── 创建（step 类型） ──────────────────────────────

  it("POST → 创建 step 用例", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "步骤用例",
        contentType: "step",
        steps: [
          { stepOrder: 1, action: "打开页面", expected: "页面加载成功" },
          { stepOrder: 2, action: "点击按钮", expected: "弹出对话框" },
        ],
        priority: "P1",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.contentType).toBe("step");
    expect(body.steps).toHaveLength(2);
    expect(body.steps[0].action).toBe("打开页面");
    expect(body.steps[1].stepOrder).toBe(2);
  });

  // ── 创建带标签 ────────────────────────────────────

  it("POST → 创建带标签的用例（自动创建标签）", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "标签用例",
        contentType: "text",
        textContent: "内容",
        tags: ["冒烟", "回归"],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.tags).toHaveLength(2);
    expect([...body.tags].sort()).toEqual(["冒烟", "回归"]);
  });

  // ── 验证规则 ──────────────────────────────────────

  it("POST text 类型缺少 textContent 返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: { title: "坏用例", contentType: "text" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST step 类型缺少 steps 返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: { title: "坏步骤", contentType: "step" },
    });
    expect(res.statusCode).toBe(400);
  });

  // ── 批量创建 ──────────────────────────────────────

  it("POST /libraries/:libraryId/cases/batch → 批量创建用例", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases/batch`,
      headers: authHeaders(),
      payload: {
        cases: [
          { title: "批量1", contentType: "text", textContent: "内容1" },
          { title: "批量2", contentType: "text", textContent: "内容2" },
          {
            title: "批量3",
            contentType: "step",
            steps: [{ stepOrder: 1, action: "操作", expected: "结果" }],
          },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(3);
  });

  // ── 查询 ──────────────────────────────────────────

  it("GET /libraries/:libraryId/cases → 列表用例（分页）", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?page=1&pageSize=5`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it("GET 按 priority 筛选", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?priority=P0`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    for (const c of body.items) {
      expect(c.priority).toBe("P0");
    }
  });

  it("GET 按 keyword 搜索", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?keyword=${encodeURIComponent("文本")}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    for (const c of body.items) {
      expect(c.title).toContain("文本");
    }
  });

  it("GET 按 directoryId 筛选", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?directoryId=${directoryId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    for (const c of body.items) {
      expect(c.directoryId).toBe(directoryId);
    }
  });

  it("GET /cases/:id → 获取用例详情（含 steps 和 tags）", async () => {
    const created = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: {
          title: "详情用例",
          contentType: "step",
          steps: [{ stepOrder: 1, action: "操作1", expected: "结果1" }],
          tags: ["详情标签"],
        },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/cases/${created.id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.steps).toHaveLength(1);
    expect(body.tags).toHaveLength(1);
  });

  // ── 更新 ──────────────────────────────────────────

  it("PUT /cases/:id → 更新用例（创建新版本）", async () => {
    const created = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "v1用例", contentType: "text", textContent: "v1" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/cases/${created.id}`,
      headers: authHeaders(),
      payload: { title: "v2用例", textContent: "v2" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.title).toBe("v2用例");
    expect(body.latestVersionNo).toBe(2);
  });

  // ── 版本历史 ──────────────────────────────────────

  it("GET /cases/:id/versions → 列表版本", async () => {
    const created = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "版本用例", contentType: "text", textContent: "v1" },
      })
      .then((r) => r.json());

    // 更新一次以产生 v2
    await app.inject({
      method: "PUT",
      url: `/api/v1/cases/${created.id}`,
      headers: authHeaders(),
      payload: { textContent: "v2" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/cases/${created.id}/versions`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /cases/:id/versions/:versionNo → 获取特定版本", async () => {
    const created = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: {
          title: "特定版本",
          contentType: "text",
          textContent: "初始",
        },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/cases/${created.id}/versions/1`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().versionNo).toBe(1);
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /cases/:id → 删除用例", async () => {
    const created = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "待删用例", contentType: "text", textContent: "内容" },
      })
      .then((r) => r.json());

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/cases/${created.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/cases/${created.id}`,
      headers: authHeaders(),
    });
    expect(getRes.statusCode).toBe(404);
  });

  // ── 批量更新 ────────────────────────────────────────

  it("PUT /libraries/:libraryId/cases/batch → 批量更新用例", async () => {
    const c1 = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "批更1", contentType: "text", textContent: "内容1" },
      })
      .then((r) => r.json());

    const c2 = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "批更2", contentType: "text", textContent: "内容2" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/libraries/${libraryId}/cases/batch`,
      headers: authHeaders(),
      payload: {
        cases: [
          { id: c1.id, title: "批更1-已更新", priority: "P0" },
          { id: c2.id, title: "批更2-已更新" },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe("批更1-已更新");
    expect(body[0].priority).toBe("P0");
    expect(body[0].latestVersionNo).toBe(2);
    expect(body[1].title).toBe("批更2-已更新");
  });

  it("PUT batch → 用例不属于该库返回 400", async () => {
    const project2 = await createSeedProject(app, { name: "另一项目" });
    const lib2 = await createSeedLibrary(app, project2.id, { name: "另一库", code: "OTHR" });

    const c = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${lib2.id}/cases`,
        headers: authHeaders(),
        payload: { title: "他库用例", contentType: "text", textContent: "内容" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/libraries/${libraryId}/cases/batch`,
      headers: authHeaders(),
      payload: { cases: [{ id: c.id, title: "非法更新" }] },
    });
    expect(res.statusCode).toBe(400);
  });

  // ── 批量删除 ────────────────────────────────────────

  it("DELETE /libraries/:libraryId/cases/batch → 批量删除用例", async () => {
    const c1 = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "批删1", contentType: "text", textContent: "内容" },
      })
      .then((r) => r.json());

    const c2 = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/cases`,
        headers: authHeaders(),
        payload: { title: "批删2", contentType: "text", textContent: "内容" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/libraries/${libraryId}/cases/batch`,
      headers: authHeaders(),
      payload: { caseIds: [c1.id, c2.id] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.deleted).toEqual([c1.id, c2.id]);
    expect(body.skipped).toEqual([]);
  });

  it("DELETE batch → 跳过不存在的用例", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/libraries/${libraryId}/cases/batch`,
      headers: authHeaders(),
      payload: { caseIds: [999999] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.deleted).toEqual([]);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0].id).toBe(999999);
  });

  it("DELETE batch → 跳过被计划引用的用例", async () => {
    const project = await createSeedProject(app, { name: "批删计划项目" });
    const lib = await createSeedLibrary(app, project.id, { name: "批删计划库", code: "BDPL" });

    const c = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${lib.id}/cases`,
        headers: authHeaders(),
        payload: { title: "被引用用例", contentType: "text", textContent: "内容" },
      })
      .then((r) => r.json());

    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/plans`,
        headers: authHeaders(),
        payload: { name: "引用计划" },
      })
      .then((r) => r.json());

    await app.inject({
      method: "POST",
      url: `/api/v1/plans/${plan.id}/cases`,
      headers: authHeaders(),
      payload: { caseIds: [c.id] },
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/api/v1/libraries/${lib.id}/cases/batch`,
      headers: authHeaders(),
      payload: { caseIds: [c.id] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.deleted).toEqual([]);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0].reason).toContain("计划");
  });

  // ── 多标签筛选 ──────────────────────────────────────

  it("GET 按多标签 AND 筛选", async () => {
    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "多标签AND用例",
        contentType: "text",
        textContent: "内容",
        tags: ["layer:ui", "env:test"],
      },
    });

    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "单标签用例",
        contentType: "text",
        textContent: "内容",
        tags: ["layer:ui"],
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?tag=${encodeURIComponent("layer:ui,env:test")}&tagOp=and`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    for (const c of body.items) {
      expect(c.tags).toContain("layer:ui");
      expect(c.tags).toContain("env:test");
    }
  });

  it("GET 按多标签 OR 筛选", async () => {
    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "OR标签A",
        contentType: "text",
        textContent: "内容",
        tags: ["filter:alpha"],
      },
    });

    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "OR标签B",
        contentType: "text",
        textContent: "内容",
        tags: ["filter:beta"],
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?tag=${encodeURIComponent("filter:alpha,filter:beta")}&tagOp=or`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    for (const c of body.items) {
      expect(c.tags.some((t: string) => t === "filter:alpha" || t === "filter:beta")).toBe(true);
    }
  });

  it("GET 单标签筛选保持向后兼容", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/libraries/${libraryId}/cases?tag=${encodeURIComponent("layer:ui")}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    for (const c of body.items) {
      expect(c.tags).toContain("layer:ui");
    }
  });
});
