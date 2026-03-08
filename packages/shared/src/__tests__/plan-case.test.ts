import { describe, it, expect } from "vitest";
import {
  createPlanCasesSchema,
  addPlanCasesByDirectorySchema,
  updatePlanCaseSchema,
  batchUpdatePlanCaseStatusSchema,
  planCaseListQuerySchema,
  planCaseHistoryListQuerySchema,
} from "../schemas/plan-case";

describe("createPlanCasesSchema", () => {
  it("接受合法 caseIds", () => {
    const result = createPlanCasesSchema.parse({ caseIds: [1, 2, 3] });
    expect(result.caseIds).toEqual([1, 2, 3]);
  });

  it("caseIds 不能为空数组", () => {
    expect(() => createPlanCasesSchema.parse({ caseIds: [] })).toThrow("请至少选择一个用例");
  });

  it("caseIds 必须为正整数", () => {
    expect(() => createPlanCasesSchema.parse({ caseIds: [0] })).toThrow();
    expect(() => createPlanCasesSchema.parse({ caseIds: [-1] })).toThrow();
  });
});

describe("addPlanCasesByDirectorySchema", () => {
  it("接受合法输入", () => {
    const result = addPlanCasesByDirectorySchema.parse({ directoryId: 5 });
    expect(result).toEqual({ directoryId: 5, recursive: true });
  });

  it("recursive 默认为 true", () => {
    expect(addPlanCasesByDirectorySchema.parse({ directoryId: 1 }).recursive).toBe(true);
  });

  it("recursive 可以设为 false", () => {
    expect(addPlanCasesByDirectorySchema.parse({ directoryId: 1, recursive: false }).recursive).toBe(false);
  });
});

describe("updatePlanCaseSchema", () => {
  it("接受状态更新", () => {
    expect(updatePlanCaseSchema.parse({ executionStatus: "passed" })).toEqual({
      executionStatus: "passed",
    });
  });

  it("接受所有执行状态", () => {
    for (const s of ["pending", "passed", "failed", "blocked", "skipped"]) {
      expect(updatePlanCaseSchema.parse({ executionStatus: s }).executionStatus).toBe(s);
    }
  });

  it("拒绝非法执行状态", () => {
    expect(() => updatePlanCaseSchema.parse({ executionStatus: "invalid" })).toThrow();
  });

  it("接受 remark", () => {
    expect(updatePlanCaseSchema.parse({ remark: "测试备注" }).remark).toBe("测试备注");
  });

  it("remark 最长 2000 字符", () => {
    expect(() => updatePlanCaseSchema.parse({ remark: "r".repeat(2001) })).toThrow("备注最多 2000 个字符");
  });

  it("reasonNote 最长 500 字符", () => {
    expect(() => updatePlanCaseSchema.parse({ reasonNote: "r".repeat(501) })).toThrow(
      "原因说明最多 500 个字符"
    );
  });
});

describe("batchUpdatePlanCaseStatusSchema", () => {
  it("接受合法批量更新", () => {
    const result = batchUpdatePlanCaseStatusSchema.parse({
      planCaseIds: [1, 2],
      executionStatus: "passed",
    });
    expect(result.planCaseIds).toEqual([1, 2]);
    expect(result.executionStatus).toBe("passed");
  });

  it("planCaseIds 不能为空", () => {
    expect(() =>
      batchUpdatePlanCaseStatusSchema.parse({ planCaseIds: [], executionStatus: "passed" })
    ).toThrow("请至少选择一条计划用例");
  });

  it("executionStatus 必填", () => {
    expect(() => batchUpdatePlanCaseStatusSchema.parse({ planCaseIds: [1] })).toThrow();
  });

  it("reasonNote 可选", () => {
    const result = batchUpdatePlanCaseStatusSchema.parse({
      planCaseIds: [1],
      executionStatus: "failed",
      reasonNote: "环境问题",
    });
    expect(result.reasonNote).toBe("环境问题");
  });
});

describe("planCaseListQuerySchema", () => {
  it("默认 sortBy 为 updatedAt", () => {
    expect(planCaseListQuerySchema.parse({}).sortBy).toBe("updatedAt");
  });

  it("接受 status 筛选", () => {
    expect(planCaseListQuerySchema.parse({ status: "failed" }).status).toBe("failed");
  });

  it("拒绝非法 status", () => {
    expect(() => planCaseListQuerySchema.parse({ status: "invalid" })).toThrow();
  });
});

describe("planCaseHistoryListQuerySchema", () => {
  it("默认 sortBy 为 createdAt", () => {
    expect(planCaseHistoryListQuerySchema.parse({}).sortBy).toBe("createdAt");
  });

  it("sortBy 只接受 createdAt", () => {
    expect(() => planCaseHistoryListQuerySchema.parse({ sortBy: "updatedAt" })).toThrow();
  });
});
