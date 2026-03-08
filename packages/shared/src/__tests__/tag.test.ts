import { describe, it, expect } from "vitest";
import { createTagSchema, tagListQuerySchema } from "../schemas/tag";

describe("createTagSchema", () => {
  it("接受合法标签名", () => {
    expect(createTagSchema.parse({ name: "冒烟测试" })).toEqual({ name: "冒烟测试" });
  });

  it("name 不能为空", () => {
    expect(() => createTagSchema.parse({ name: "" })).toThrow("请填写标签名称");
  });

  it("name 最长 64 字符", () => {
    expect(() => createTagSchema.parse({ name: "a".repeat(65) })).toThrow("标签名称最多 64 个字符");
    expect(createTagSchema.parse({ name: "a".repeat(64) })).toBeTruthy();
  });
});

describe("tagListQuerySchema", () => {
  it("默认 sortBy 为 name", () => {
    expect(tagListQuerySchema.parse({}).sortBy).toBe("name");
  });
});
