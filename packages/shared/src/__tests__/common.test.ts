import { describe, it, expect } from "vitest";
import {
  idParamSchema,
  pageQuerySchema,
  errorResponseSchema,
  dateSchema,
  isoDateTimeSchema,
  buildPaginatedResponseSchema,
} from "../schemas/common";
import { z } from "zod";

describe("idParamSchema", () => {
  it("接受正整数", () => {
    expect(idParamSchema.parse({ id: 1 })).toEqual({ id: 1 });
    expect(idParamSchema.parse({ id: "42" })).toEqual({ id: 42 });
  });

  it("拒绝非正整数", () => {
    expect(() => idParamSchema.parse({ id: 0 })).toThrow();
    expect(() => idParamSchema.parse({ id: -1 })).toThrow();
    expect(() => idParamSchema.parse({ id: 1.5 })).toThrow();
    expect(() => idParamSchema.parse({ id: "abc" })).toThrow();
  });
});

describe("pageQuerySchema", () => {
  it("使用默认值", () => {
    const result = pageQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20, sortOrder: "desc" });
  });

  it("接受合法分页参数", () => {
    const result = pageQuerySchema.parse({ page: "3", pageSize: "50", sortOrder: "asc" });
    expect(result).toEqual({ page: 3, pageSize: 50, sortOrder: "asc" });
  });

  it("pageSize 最大 100", () => {
    expect(() => pageQuerySchema.parse({ pageSize: 101 })).toThrow();
  });

  it("page 必须为正整数", () => {
    expect(() => pageQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => pageQuerySchema.parse({ page: -1 })).toThrow();
  });

  it("sortOrder 只接受 asc/desc", () => {
    expect(() => pageQuerySchema.parse({ sortOrder: "random" })).toThrow();
  });
});

describe("errorResponseSchema", () => {
  it("接受 error 字符串", () => {
    expect(errorResponseSchema.parse({ error: "something went wrong" })).toEqual({
      error: "something went wrong",
    });
  });

  it("拒绝缺少 error 字段", () => {
    expect(() => errorResponseSchema.parse({})).toThrow();
  });
});

describe("dateSchema", () => {
  it("接受 YYYY-MM-DD 格式", () => {
    expect(dateSchema.parse("2026-03-01")).toBe("2026-03-01");
    expect(dateSchema.parse("2025-12-31")).toBe("2025-12-31");
  });

  it("拒绝非日期格式", () => {
    expect(() => dateSchema.parse("2026/03/01")).toThrow();
    expect(() => dateSchema.parse("03-01-2026")).toThrow();
    expect(() => dateSchema.parse("2026-3-1")).toThrow();
    expect(() => dateSchema.parse("not-a-date")).toThrow();
  });
});

describe("isoDateTimeSchema", () => {
  it("接受带时区偏移的 ISO 8601", () => {
    expect(isoDateTimeSchema.parse("2026-03-01T12:00:00+08:00")).toBe("2026-03-01T12:00:00+08:00");
    expect(isoDateTimeSchema.parse("2026-03-01T04:00:00Z")).toBe("2026-03-01T04:00:00Z");
  });

  it("拒绝不带时区的 ISO 字符串", () => {
    expect(() => isoDateTimeSchema.parse("2026-03-01T12:00:00")).toThrow();
  });

  it("拒绝非 ISO 格式", () => {
    expect(() => isoDateTimeSchema.parse("not-a-datetime")).toThrow();
  });
});

describe("buildPaginatedResponseSchema", () => {
  const itemSchema = z.object({ name: z.string() });
  const paginatedSchema = buildPaginatedResponseSchema(itemSchema);

  it("接受合法分页响应", () => {
    const data = {
      items: [{ name: "a" }, { name: "b" }],
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    };
    expect(paginatedSchema.parse(data)).toEqual(data);
  });

  it("接受空列表", () => {
    const data = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };
    expect(paginatedSchema.parse(data)).toEqual(data);
  });

  it("拒绝缺少分页字段", () => {
    expect(() => paginatedSchema.parse({ items: [] })).toThrow();
  });

  it("拒绝 items 中的非法元素", () => {
    expect(() =>
      paginatedSchema.parse({
        items: [{ invalid: true }],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      })
    ).toThrow();
  });
});
