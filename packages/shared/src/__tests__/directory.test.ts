import { describe, it, expect } from "vitest";
import {
  createDirectorySchema,
  updateDirectorySchema,
  directoryTreeSchema,
  directoryListQuerySchema,
} from "../schemas/directory";

describe("createDirectorySchema", () => {
  it("接受合法输入", () => {
    const result = createDirectorySchema.parse({ name: "模块A" });
    expect(result).toEqual({ name: "模块A", sortOrder: 0 });
  });

  it("接受带 parentId 的输入", () => {
    const result = createDirectorySchema.parse({ name: "子目录", parentId: 1 });
    expect(result.parentId).toBe(1);
  });

  it("parentId 可以为 null（根目录）", () => {
    const result = createDirectorySchema.parse({ name: "根目录", parentId: null });
    expect(result.parentId).toBeNull();
  });

  it("sortOrder 默认为 0", () => {
    expect(createDirectorySchema.parse({ name: "x" }).sortOrder).toBe(0);
  });

  it("sortOrder 不能为负数", () => {
    expect(() => createDirectorySchema.parse({ name: "x", sortOrder: -1 })).toThrow();
  });

  it("name 不能为空", () => {
    expect(() => createDirectorySchema.parse({ name: "" })).toThrow("请填写名称");
  });

  it("name 最长 120 字符", () => {
    expect(() => createDirectorySchema.parse({ name: "a".repeat(121) })).toThrow();
  });
});

describe("updateDirectorySchema", () => {
  it("接受部分更新", () => {
    expect(updateDirectorySchema.parse({ name: "新名称" })).toEqual({ name: "新名称" });
    expect(updateDirectorySchema.parse({ sortOrder: 5 })).toEqual({ sortOrder: 5 });
  });

  it("拒绝空对象", () => {
    expect(() => updateDirectorySchema.parse({})).toThrow("至少需要填写一项");
  });

  it("可以将 parentId 设为 null", () => {
    expect(updateDirectorySchema.parse({ parentId: null })).toEqual({ parentId: null });
  });
});

describe("directoryTreeSchema", () => {
  it("接受嵌套树结构", () => {
    const now = "2026-03-01T00:00:00Z";
    const tree = {
      id: 1,
      libraryId: 1,
      parentId: null,
      name: "根",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      children: [
        {
          id: 2,
          libraryId: 1,
          parentId: 1,
          name: "子",
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
          children: [],
        },
      ],
    };
    expect(directoryTreeSchema.parse(tree)).toEqual(tree);
  });

  it("拒绝缺少 children 字段", () => {
    const now = "2026-03-01T00:00:00Z";
    expect(() =>
      directoryTreeSchema.parse({
        id: 1,
        libraryId: 1,
        parentId: null,
        name: "根",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
    ).toThrow();
  });
});

describe("directoryListQuerySchema", () => {
  it("默认 sortBy 为 sortOrder", () => {
    expect(directoryListQuerySchema.parse({}).sortBy).toBe("sortOrder");
  });
});
