import { describe, it, expect } from "vitest";
import {
  caseStepSchema,
  createCaseSchema,
  updateCaseSchema,
  batchCreateCaseSchema,
  batchUpdateCaseSchema,
  batchDeleteCaseSchema,
  caseListQuerySchema,
} from "../schemas/case";

describe("caseStepSchema", () => {
  it("接受合法步骤", () => {
    expect(caseStepSchema.parse({ stepOrder: 1, action: "点击按钮" })).toEqual({
      stepOrder: 1,
      action: "点击按钮",
    });
  });

  it("接受带 expected 的步骤", () => {
    const step = caseStepSchema.parse({ stepOrder: 1, action: "输入", expected: "显示结果" });
    expect(step.expected).toBe("显示结果");
  });

  it("stepOrder 必须为正整数", () => {
    expect(() => caseStepSchema.parse({ stepOrder: 0, action: "x" })).toThrow();
    expect(() => caseStepSchema.parse({ stepOrder: -1, action: "x" })).toThrow();
  });

  it("action 不能为空", () => {
    expect(() => caseStepSchema.parse({ stepOrder: 1, action: "" })).toThrow("请填写步骤说明");
  });
});

describe("createCaseSchema", () => {
  it("接受 text 类型用例", () => {
    const result = createCaseSchema.parse({
      title: "测试用例",
      contentType: "text",
      textContent: "正文内容",
    });
    expect(result.title).toBe("测试用例");
    expect(result.contentType).toBe("text");
  });

  it("text 类型必须有 textContent", () => {
    expect(() =>
      createCaseSchema.parse({
        title: "测试",
        contentType: "text",
      })
    ).toThrow("文本类型用例须填写正文内容");
  });

  it("接受 step 类型用例", () => {
    const result = createCaseSchema.parse({
      title: "步骤用例",
      contentType: "step",
      steps: [{ stepOrder: 1, action: "步骤一" }],
    });
    expect(result.contentType).toBe("step");
    expect(result.steps).toHaveLength(1);
  });

  it("step 类型必须有至少一步", () => {
    expect(() =>
      createCaseSchema.parse({
        title: "测试",
        contentType: "step",
        steps: [],
      })
    ).toThrow("步骤类型用例须至少添加一步");
  });

  it("默认 contentType 为 text", () => {
    const result = createCaseSchema.parse({
      title: "测试",
      textContent: "内容",
    });
    expect(result.contentType).toBe("text");
  });

  it("默认 priority 为 P1", () => {
    const result = createCaseSchema.parse({
      title: "测试",
      contentType: "text",
      textContent: "x",
    });
    expect(result.priority).toBe("P1");
  });

  it("默认 caseType 为 functional", () => {
    const result = createCaseSchema.parse({
      title: "测试",
      contentType: "text",
      textContent: "x",
    });
    expect(result.caseType).toBe("functional");
  });

  it("接受所有 priority 枚举", () => {
    for (const p of ["P0", "P1", "P2", "P3"]) {
      expect(
        createCaseSchema.parse({ title: "t", contentType: "text", textContent: "x", priority: p })
      ).toBeTruthy();
    }
  });

  it("拒绝非法 priority", () => {
    expect(() =>
      createCaseSchema.parse({ title: "t", contentType: "text", textContent: "x", priority: "P4" })
    ).toThrow();
  });

  it("接受所有 caseType 枚举", () => {
    for (const t of ["functional", "performance", "api", "ui", "other"]) {
      expect(
        createCaseSchema.parse({ title: "t", contentType: "text", textContent: "x", caseType: t })
      ).toBeTruthy();
    }
  });

  it("tags 默认为空数组", () => {
    const result = createCaseSchema.parse({ title: "t", contentType: "text", textContent: "x" });
    expect(result.tags).toEqual([]);
  });

  it("tags 元素不能为空字符串", () => {
    expect(() =>
      createCaseSchema.parse({ title: "t", contentType: "text", textContent: "x", tags: [""] })
    ).toThrow();
  });

  it("tags 元素最长 64 字符", () => {
    expect(() =>
      createCaseSchema.parse({
        title: "t",
        contentType: "text",
        textContent: "x",
        tags: ["a".repeat(65)],
      })
    ).toThrow();
  });

  it("title 不能为空", () => {
    expect(() =>
      createCaseSchema.parse({ title: "", contentType: "text", textContent: "x" })
    ).toThrow("请填写标题");
  });

  it("title 最长 300 字符", () => {
    expect(() =>
      createCaseSchema.parse({ title: "a".repeat(301), contentType: "text", textContent: "x" })
    ).toThrow("标题最多 300 个字符");
  });
});

describe("updateCaseSchema", () => {
  it("接受部分更新", () => {
    expect(updateCaseSchema.parse({ title: "新标题" })).toMatchObject({ title: "新标题" });
    expect(updateCaseSchema.parse({ priority: "P0" })).toMatchObject({ priority: "P0" });
  });

  it("拒绝空对象", () => {
    expect(() => updateCaseSchema.parse({})).toThrow("至少需要填写一项");
  });
});

describe("batchCreateCaseSchema", () => {
  it("接受至少一条用例", () => {
    const result = batchCreateCaseSchema.parse({
      cases: [{ title: "用例1", contentType: "text", textContent: "内容" }],
    });
    expect(result.cases).toHaveLength(1);
  });

  it("拒绝空数组", () => {
    expect(() => batchCreateCaseSchema.parse({ cases: [] })).toThrow("请至少添加一条用例");
  });

  it("批量中的每条用例也校验 superRefine", () => {
    expect(() =>
      batchCreateCaseSchema.parse({
        cases: [{ title: "用例", contentType: "step", steps: [] }],
      })
    ).toThrow("步骤类型用例须至少添加一步");
  });
});

describe("batchUpdateCaseSchema", () => {
  it("接受带 id 的部分更新", () => {
    const result = batchUpdateCaseSchema.parse({
      cases: [{ id: 1, title: "新标题" }],
    });
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].id).toBe(1);
    expect(result.cases[0].title).toBe("新标题");
  });

  it("接受多条更新", () => {
    const result = batchUpdateCaseSchema.parse({
      cases: [
        { id: 1, title: "标题1", priority: "P0" },
        { id: 2, priority: "P2" },
      ],
    });
    expect(result.cases).toHaveLength(2);
  });

  it("拒绝空数组", () => {
    expect(() => batchUpdateCaseSchema.parse({ cases: [] })).toThrow("请至少选择一条用例");
  });

  it("id 必须为正整数", () => {
    expect(() =>
      batchUpdateCaseSchema.parse({ cases: [{ id: -1, title: "x" }] })
    ).toThrow();
  });

  it("拒绝非法 priority", () => {
    expect(() =>
      batchUpdateCaseSchema.parse({ cases: [{ id: 1, priority: "P9" }] })
    ).toThrow();
  });
});

describe("batchDeleteCaseSchema", () => {
  it("接受 caseIds 数组", () => {
    const result = batchDeleteCaseSchema.parse({ caseIds: [1, 2, 3] });
    expect(result.caseIds).toEqual([1, 2, 3]);
  });

  it("拒绝空数组", () => {
    expect(() => batchDeleteCaseSchema.parse({ caseIds: [] })).toThrow("请至少选择一条用例");
  });

  it("id 必须为正整数", () => {
    expect(() => batchDeleteCaseSchema.parse({ caseIds: [0] })).toThrow();
    expect(() => batchDeleteCaseSchema.parse({ caseIds: [-1] })).toThrow();
  });
});

describe("caseListQuerySchema", () => {
  it("使用默认值", () => {
    const result = caseListQuerySchema.parse({});
    expect(result.sortBy).toBe("updatedAt");
  });

  it("接受筛选参数", () => {
    const result = caseListQuerySchema.parse({
      priority: "P0",
      type: "api",
      tag: "冒烟",
      keyword: "登录",
      directoryId: "5",
    });
    expect(result.priority).toBe("P0");
    expect(result.type).toBe("api");
    expect(result.tag).toBe("冒烟");
    expect(result.keyword).toBe("登录");
    expect(result.directoryId).toBe(5);
  });

  it("拒绝非法 priority 筛选", () => {
    expect(() => caseListQuerySchema.parse({ priority: "P9" })).toThrow();
  });

  it("拒绝非法 type 筛选", () => {
    expect(() => caseListQuerySchema.parse({ type: "invalid" })).toThrow();
  });

  it("tagOp 默认为 and", () => {
    const result = caseListQuerySchema.parse({});
    expect(result.tagOp).toBe("and");
  });

  it("接受 tagOp=or", () => {
    const result = caseListQuerySchema.parse({ tagOp: "or" });
    expect(result.tagOp).toBe("or");
  });

  it("拒绝非法 tagOp", () => {
    expect(() => caseListQuerySchema.parse({ tagOp: "xor" })).toThrow();
  });

  it("接受逗号分隔的 tag 参数", () => {
    const result = caseListQuerySchema.parse({ tag: "layer:ui,req:login" });
    expect(result.tag).toBe("layer:ui,req:login");
  });
});
