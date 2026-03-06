import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";
import {
  createTestApp,
  destroyTestApp,
  authHeaders,
  createSeedProject,
} from "./helpers/setup";

describe("Plans API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let projectId: number;

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());
    const project = await createSeedProject(app, { name: "计划测试项目" });
    projectId = project.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 创建 ──────────────────────────────────────────

  it("POST /projects/:projectId/plans → 创建计划", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/plans`,
      headers: authHeaders(),
      payload: {
        name: "迭代1计划",
        description: "第一个迭代",
        startDate: "2026-03-01",
        endDate: "2026-03-15",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      name: "迭代1计划",
      status: "draft",
      projectId,
    });
    expect(body.id).toBeDefined();
  });

  it("POST 缺少 name 返回 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/plans`,
      headers: authHeaders(),
      payload: { description: "无名计划" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST 指定初始状态", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectId}/plans`,
      headers: authHeaders(),
      payload: { name: "进行中计划", status: "in_progress" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("in_progress");
  });

  // ── 查询 ──────────────────────────────────────────

  it("GET /projects/:projectId/plans → 列表计划", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/plans`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("GET 按 status 筛选", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectId}/plans?status=draft`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    for (const p of res.json().items) {
      expect(p.status).toBe("draft");
    }
  });

  it("GET /plans/:id → 获取计划详情", async () => {
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "详情计划" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${plan.id}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("详情计划");
  });

  it("GET /plans/:id 不存在返回 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/plans/99999",
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  // ── 更新 ──────────────────────────────────────────

  it("PUT /plans/:id → 更新计划", async () => {
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "待更新计划" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/plans/${plan.id}`,
      headers: authHeaders(),
      payload: { name: "已更新计划", status: "in_progress" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe("已更新计划");
    expect(body.status).toBe("in_progress");
  });

  it("PUT 状态流转 draft → in_progress → completed → archived", async () => {
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "状态流转计划" },
      })
      .then((r) => r.json());

    for (const status of ["in_progress", "completed", "archived"] as const) {
      const res = await app.inject({
        method: "PUT",
        url: `/api/v1/plans/${plan.id}`,
        headers: authHeaders(),
        payload: { status },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe(status);
    }
  });

  // ── 统计 ──────────────────────────────────────────

  it("GET /plans/:id/stats → 获取计划统计", async () => {
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "统计计划" },
      })
      .then((r) => r.json());

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${plan.id}/stats`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("pending");
    expect(body).toHaveProperty("passed");
    expect(body).toHaveProperty("failed");
    expect(body).toHaveProperty("blocked");
    expect(body).toHaveProperty("skipped");
  });

  // ── 删除 ──────────────────────────────────────────

  it("DELETE /plans/:id → 删除计划", async () => {
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "待删计划" },
      })
      .then((r) => r.json());

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/plans/${plan.id}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${plan.id}`,
      headers: authHeaders(),
    });
    expect(getRes.statusCode).toBe(404);
  });
});
