import { describe, it, expect } from "vitest";
import {
  createPlanCasesSchema,
  addPlanCasesByDirectorySchema,
  updatePlanCaseSchema,
  batchUpdatePlanCaseStatusSchema,
  planCaseListQuerySchema,
  planCaseHistoryListQuerySchema,
  createPlanCaseRemarkSchema,
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
});

describe("createPlanCaseRemarkSchema", () => {
  it("接受合法备注", () => {
    const result = createPlanCaseRemarkSchema.parse({ content: "测试备注" });
    expect(result.content).toBe("测试备注");
  });

  it("content 不能为空", () => {
    expect(() => createPlanCaseRemarkSchema.parse({ content: "" })).toThrow("备注内容不能为空");
  });

  it("content 最长 2000 字符", () => {
    expect(() => createPlanCaseRemarkSchema.parse({ content: "r".repeat(2001) })).toThrow(
      "备注最多 2000 个字符"
    );
  });

  it("content 必填", () => {
    expect(() => createPlanCaseRemarkSchema.parse({})).toThrow();
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
