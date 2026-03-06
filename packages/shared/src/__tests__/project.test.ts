import { describe, it, expect } from "vitest";
import { createProjectSchema, updateProjectSchema, projectListQuerySchema } from "../schemas/project";

describe("createProjectSchema", () => {
  it("接受合法输入", () => {
    const result = createProjectSchema.parse({ name: "项目A" });
    expect(result).toEqual({ name: "项目A" });
  });

  it("接受带描述的输入", () => {
    const result = createProjectSchema.parse({ name: "项目A", description: "一些描述" });
    expect(result).toEqual({ name: "项目A", description: "一些描述" });
  });

  it("name 不能为空", () => {
    expect(() => createProjectSchema.parse({ name: "" })).toThrow("请填写名称");
  });

  it("name 最长 120 字符", () => {
    expect(() => createProjectSchema.parse({ name: "a".repeat(121) })).toThrow("名称最多 120 个字符");
    expect(createProjectSchema.parse({ name: "a".repeat(120) })).toBeTruthy();
  });

  it("description 最长 2000 字符", () => {
    expect(() => createProjectSchema.parse({ name: "p", description: "d".repeat(2001) })).toThrow(
      "描述最多 2000 个字符"
    );
  });

  it("description 可选", () => {
    const result = createProjectSchema.parse({ name: "p" });
    expect(result.description).toBeUndefined();
  });
});

describe("updateProjectSchema", () => {
  it("接受部分更新", () => {
    expect(updateProjectSchema.parse({ name: "新名称" })).toEqual({ name: "新名称" });
    expect(updateProjectSchema.parse({ description: "新描述" })).toEqual({ description: "新描述" });
  });

  it("拒绝空对象", () => {
    expect(() => updateProjectSchema.parse({})).toThrow("至少需要填写一项");
  });
});

describe("projectListQuerySchema", () => {
  it("使用默认值", () => {
    const result = projectListQuerySchema.parse({});
    expect(result.sortBy).toBe("updatedAt");
    expect(result.sortOrder).toBe("desc");
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("sortBy 只接受指定枚举", () => {
    expect(projectListQuerySchema.parse({ sortBy: "createdAt" }).sortBy).toBe("createdAt");
    expect(projectListQuerySchema.parse({ sortBy: "name" }).sortBy).toBe("name");
    expect(() => projectListQuerySchema.parse({ sortBy: "invalid" })).toThrow();
  });
});
