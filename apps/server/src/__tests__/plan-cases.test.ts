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

describe("Plan Cases API", () => {
  let app: FastifyInstance;
  let sqliteDb: InstanceType<typeof Database>;
  let projectId: number;
  let libraryId: number;
  let planId: number;
  let caseIds: number[] = [];

  beforeAll(async () => {
    ({ app, sqliteDb } = await createTestApp());

    const project = await createSeedProject(app, { name: "计划用例项目" });
    projectId = project.id;

    const lib = await createSeedLibrary(app, projectId, {
      name: "计划用例库",
      code: "PLNC",
    });
    libraryId = lib.id;

    // 创建几个用例
    for (const title of ["用例A", "用例B", "用例C"]) {
      const c = await app
        .inject({
          method: "POST",
          url: `/api/v1/libraries/${libraryId}/cases`,
          headers: authHeaders(),
          payload: { title, contentType: "text", textContent: `${title}内容` },
        })
        .then((r) => r.json());
      caseIds.push(c.id);
    }

    // 创建计划
    const plan = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "执行计划", status: "in_progress" },
      })
      .then((r) => r.json());
    planId = plan.id;
  });

  afterAll(async () => {
    await destroyTestApp(app, sqliteDb);
  });

  // ── 添加用例到计划 ────────────────────────────────

  it("POST /plans/:planId/cases → 添加用例到计划", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/plans/${planId}/cases`,
      headers: authHeaders(),
      payload: { caseIds: [caseIds[0], caseIds[1]] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.added).toHaveLength(2);
    expect(body.skipped).toHaveLength(0);
  });

  it("POST 重复添加同一用例被跳过", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/plans/${planId}/cases`,
      headers: authHeaders(),
      payload: { caseIds: [caseIds[0], caseIds[2]] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // caseIds[0] 已存在应被跳过，caseIds[2] 新增
    expect(body.added).toHaveLength(1);
    expect(body.skipped).toHaveLength(1);
  });

  // ── 按目录添加用例 ────────────────────────────────

  it("POST /plans/:planId/cases/by-directory → 按目录添加", async () => {
    // 创建一个新计划和带目录的用例
    const plan2 = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "目录计划" },
      })
      .then((r) => r.json());

    const dir = await app
      .inject({
        method: "POST",
        url: `/api/v1/libraries/${libraryId}/directories`,
        headers: authHeaders(),
        payload: { name: "目录X" },
      })
      .then((r) => r.json());

    await app.inject({
      method: "POST",
      url: `/api/v1/libraries/${libraryId}/cases`,
      headers: authHeaders(),
      payload: {
        title: "目录用例X",
        directoryId: dir.id,
        contentType: "text",
        textContent: "内容",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/plans/${plan2.id}/cases/by-directory`,
      headers: authHeaders(),
      payload: { directoryId: dir.id, recursive: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().added.length).toBeGreaterThanOrEqual(1);
  });

  // ── 列表计划用例 ──────────────────────────────────

  it("GET /plans/:planId/cases → 列表计划中的用例", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${planId}/cases`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    // 检查返回结构包含用例信息
    const first = body.items[0];
    expect(first).toHaveProperty("executionStatus");
    expect(first).toHaveProperty("caseId");
  });

  it("GET 按 status 筛选", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${planId}/cases?status=pending`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    for (const pc of res.json().items) {
      expect(pc.executionStatus).toBe("pending");
    }
  });

  // ── 更新执行状态 ──────────────────────────────────

  it("PUT /plans/:planId/cases/:planCaseId → 更新执行状态", async () => {
    // 获取第一个 planCase
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const planCaseId = listRes.items[0].id;

    const res = await app.inject({
      method: "PUT",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}`,
      headers: authHeaders(),
      payload: {
        executionStatus: "passed",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().executionStatus).toBe("passed");
  });

  // ── 批量更新状态 ──────────────────────────────────

  it("POST /plans/:planId/cases/batch-status → 批量更新状态", async () => {
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());

    const planCaseIds = listRes.items.map((pc: { id: number }) => pc.id);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/plans/${planId}/cases/batch-status`,
      headers: authHeaders(),
      payload: {
        planCaseIds,
        executionStatus: "failed",
      },
    });
    expect(res.statusCode).toBe(204);

    // 验证状态已被更新
    const afterRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    for (const pc of afterRes.items) {
      expect(pc.executionStatus).toBe("failed");
    }
  });

  // ── 历史记录 ──────────────────────────────────────

  it("GET /plans/:planId/cases/:planCaseId/history → 用例执行历史", async () => {
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const planCaseId = listRes.items[0].id;

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}/history`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    // 至少有创建记录 + 状态更新记录
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /plans/:planId/history → 计划整体历史", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${planId}/history`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  // ── 移除用例 ──────────────────────────────────────

  it("DELETE /plans/:planId/cases/:planCaseId → 移除计划用例", async () => {
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const planCaseId = listRes.items[0].id;
    const countBefore = listRes.items.length;

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 验证数量减少
    const afterRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    expect(afterRes.items.length).toBe(countBefore - 1);
  });

  // ── 备注 API ──────────────────────────────────────

  it("POST /plans/:planId/cases/:planCaseId/remarks → 创建备注", async () => {
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const planCaseId = listRes.items[0].id;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}/remarks`,
      headers: authHeaders(),
      payload: { content: "这是一条备注" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().content).toBe("这是一条备注");
    expect(res.json().planCaseId).toBe(planCaseId);
  });

  it("GET /plans/:planId/cases/:planCaseId/remarks → 备注列表按时间倒序", async () => {
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${planId}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const planCaseId = listRes.items[0].id;

    // 添加第二条备注
    await app.inject({
      method: "POST",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}/remarks`,
      headers: authHeaders(),
      payload: { content: "第二条备注" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${planId}/cases/${planCaseId}/remarks`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    // 默认 desc，第一条应该是最新的
    expect(body.items[0].content).toBe("第二条备注");
  });

  it("删除 planCase 时级联删除备注", async () => {
    // 新建计划和用例
    const plan4 = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "备注级联计划" },
      })
      .then((r) => r.json());

    await app.inject({
      method: "POST",
      url: `/api/v1/plans/${plan4.id}/cases`,
      headers: authHeaders(),
      payload: { caseIds: [caseIds[0]] },
    });

    const pcList = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${plan4.id}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());
    const pcId = pcList.items[0].id;

    // 添加备注
    await app.inject({
      method: "POST",
      url: `/api/v1/plans/${plan4.id}/cases/${pcId}/remarks`,
      headers: authHeaders(),
      payload: { content: "待级联删除的备注" },
    });

    // 删除 planCase
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/plans/${plan4.id}/cases/${pcId}`,
      headers: authHeaders(),
    });
    expect(delRes.statusCode).toBe(204);

    // 备注应该也被级联删除了（通过尝试获取来验证）
    // 由于 planCase 已删除，remarks 端点应该返回 404
    const remarkRes = await app.inject({
      method: "GET",
      url: `/api/v1/plans/${plan4.id}/cases/${pcId}/remarks`,
      headers: authHeaders(),
    });
    // planCase 不存在后，查询备注应该返回空列表（planCaseId 在 remarks 表已无数据）
    // 这里不会 404 因为只检查 plan 存在
    expect(remarkRes.statusCode).toBe(200);
    expect(remarkRes.json().items).toHaveLength(0);
  });

  // ── 统计验证 ──────────────────────────────────────

  it("统计反映实际执行状态分布", async () => {
    // 创建新计划用于干净的统计测试
    const plan3 = await app
      .inject({
        method: "POST",
        url: `/api/v1/projects/${projectId}/plans`,
        headers: authHeaders(),
        payload: { name: "统计计划" },
      })
      .then((r) => r.json());

    // 添加用例
    await app.inject({
      method: "POST",
      url: `/api/v1/plans/${plan3.id}/cases`,
      headers: authHeaders(),
      payload: { caseIds },
    });

    // 获取 planCases
    const listRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${plan3.id}/cases`,
        headers: authHeaders(),
      })
      .then((r) => r.json());

    // 标记第一个为 passed
    await app.inject({
      method: "PUT",
      url: `/api/v1/plans/${plan3.id}/cases/${listRes.items[0].id}`,
      headers: authHeaders(),
      payload: { executionStatus: "passed" },
    });

    // 标记第二个为 failed
    await app.inject({
      method: "PUT",
      url: `/api/v1/plans/${plan3.id}/cases/${listRes.items[1].id}`,
      headers: authHeaders(),
      payload: { executionStatus: "failed" },
    });

    const statsRes = await app
      .inject({
        method: "GET",
        url: `/api/v1/plans/${plan3.id}/stats`,
        headers: authHeaders(),
      })
      .then((r) => r.json());

    expect(statsRes.total).toBe(3);
    expect(statsRes.passed).toBe(1);
    expect(statsRes.failed).toBe(1);
    expect(statsRes.pending).toBe(1);
  });
});
