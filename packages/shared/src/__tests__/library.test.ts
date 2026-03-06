import { describe, it, expect } from "vitest";
import { createLibrarySchema, updateLibrarySchema, libraryListQuerySchema } from "../schemas/library";

describe("createLibrarySchema", () => {
  it("接受合法输入", () => {
    const result = createLibrarySchema.parse({ name: "用例库A", code: "AB01" });
    expect(result).toEqual({ name: "用例库A", code: "AB01" });
  });

  it("code 必须为 4 位大写字母或数字", () => {
    expect(createLibrarySchema.parse({ name: "n", code: "ABCD" })).toBeTruthy();
    expect(createLibrarySchema.parse({ name: "n", code: "1234" })).toBeTruthy();
    expect(createLibrarySchema.parse({ name: "n", code: "A1B2" })).toBeTruthy();
  });

  it("code 拒绝小写字母", () => {
    expect(() => createLibrarySchema.parse({ name: "n", code: "abcd" })).toThrow("标识码须为 4 位大写字母或数字");
  });

  it("code 拒绝非 4 位", () => {
    expect(() => createLibrarySchema.parse({ name: "n", code: "ABC" })).toThrow();
    expect(() => createLibrarySchema.parse({ name: "n", code: "ABCDE" })).toThrow();
  });

  it("code 拒绝特殊字符", () => {
    expect(() => createLibrarySchema.parse({ name: "n", code: "AB-1" })).toThrow();
    expect(() => createLibrarySchema.parse({ name: "n", code: "AB_1" })).toThrow();
  });

  it("name 不能为空", () => {
    expect(() => createLibrarySchema.parse({ name: "", code: "ABCD" })).toThrow("请填写名称");
  });

  it("name 最长 120 字符", () => {
    expect(() => createLibrarySchema.parse({ name: "a".repeat(121), code: "ABCD" })).toThrow();
  });
});

describe("updateLibrarySchema", () => {
  it("接受部分更新", () => {
    expect(updateLibrarySchema.parse({ name: "新名称" })).toEqual({ name: "新名称" });
    expect(updateLibrarySchema.parse({ code: "XY99" })).toEqual({ code: "XY99" });
  });

  it("拒绝空对象", () => {
    expect(() => updateLibrarySchema.parse({})).toThrow("至少需要填写一项");
  });

  it("部分更新仍然校验 code 格式", () => {
    expect(() => updateLibrarySchema.parse({ code: "bad" })).toThrow();
  });
});

describe("libraryListQuerySchema", () => {
  it("默认 sortBy 为 updatedAt", () => {
    expect(libraryListQuerySchema.parse({}).sortBy).toBe("updatedAt");
  });

  it("sortBy 接受 code", () => {
    expect(libraryListQuerySchema.parse({ sortBy: "code" }).sortBy).toBe("code");
  });
});
