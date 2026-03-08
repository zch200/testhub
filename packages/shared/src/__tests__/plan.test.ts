import { describe, it, expect } from "vitest";
import { createPlanSchema, updatePlanSchema, planListQuerySchema, planStatsSchema } from "../schemas/plan";

describe("createPlanSchema", () => {
  it("接受合法输入", () => {
    const result = createPlanSchema.parse({ name: "Sprint 1" });
    expect(result).toEqual({ name: "Sprint 1", status: "draft" });
  });

  it("接受完整输入", () => {
    const result = createPlanSchema.parse({
      name: "Sprint 1",
      description: "第一轮测试",
      startDate: "2026-03-01",
      endDate: "2026-03-15",
      status: "in_progress",
    });
    expect(result.startDate).toBe("2026-03-01");
    expect(result.endDate).toBe("2026-03-15");
    expect(result.status).toBe("in_progress");
  });

  it("name 不能为空", () => {
    expect(() => createPlanSchema.parse({ name: "" })).toThrow("请填写计划名称");
  });

  it("name 最长 200 字符", () => {
    expect(() => createPlanSchema.parse({ name: "a".repeat(201) })).toThrow("计划名称最多 200 个字符");
  });

  it("默认 status 为 draft", () => {
    expect(createPlanSchema.parse({ name: "p" }).status).toBe("draft");
  });

  it("接受所有 status 枚举", () => {
    for (const s of ["draft", "in_progress", "completed", "archived"]) {
      expect(createPlanSchema.parse({ name: "p", status: s }).status).toBe(s);
    }
  });

  it("拒绝非法 status", () => {
    expect(() => createPlanSchema.parse({ name: "p", status: "cancelled" })).toThrow();
  });

  it("date 必须为 YYYY-MM-DD 格式", () => {
    expect(() => createPlanSchema.parse({ name: "p", startDate: "2026/03/01" })).toThrow();
    expect(() => createPlanSchema.parse({ name: "p", endDate: "March 1" })).toThrow();
  });

  it("description 最长 2000 字符", () => {
    expect(() => createPlanSchema.parse({ name: "p", description: "d".repeat(2001) })).toThrow();
  });
});

describe("updatePlanSchema", () => {
  it("接受部分更新", () => {
    expect(updatePlanSchema.parse({ name: "新计划名" })).toMatchObject({ name: "新计划名" });
    expect(updatePlanSchema.parse({ status: "completed" })).toMatchObject({ status: "completed" });
  });

  it("拒绝空对象", () => {
    expect(() => updatePlanSchema.parse({})).toThrow("至少需要填写一项");
  });
});

describe("planStatsSchema", () => {
  it("接受合法统计数据", () => {
    const stats = { total: 10, pending: 3, passed: 4, failed: 1, blocked: 1, skipped: 1 };
    expect(planStatsSchema.parse(stats)).toEqual(stats);
  });

  it("所有字段不能为负数", () => {
    expect(() => planStatsSchema.parse({ total: -1, pending: 0, passed: 0, failed: 0, blocked: 0, skipped: 0 })).toThrow();
  });

  it("拒绝缺少字段", () => {
    expect(() => planStatsSchema.parse({ total: 10 })).toThrow();
  });
});

describe("planListQuerySchema", () => {
  it("默认 sortBy 为 updatedAt", () => {
    expect(planListQuerySchema.parse({}).sortBy).toBe("updatedAt");
  });

  it("接受 status 筛选", () => {
    expect(planListQuerySchema.parse({ status: "draft" }).status).toBe("draft");
  });

  it("拒绝非法 status 筛选", () => {
    expect(() => planListQuerySchema.parse({ status: "invalid" })).toThrow();
  });

  it("sortBy 接受 startDate/endDate", () => {
    expect(planListQuerySchema.parse({ sortBy: "startDate" }).sortBy).toBe("startDate");
    expect(planListQuerySchema.parse({ sortBy: "endDate" }).sortBy).toBe("endDate");
  });
});
