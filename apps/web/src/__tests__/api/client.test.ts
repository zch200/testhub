import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest } from "../../api/client";

describe("apiRequest", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    window.__TESTHUB_RUNTIME__ = {
      apiBase: "/api/v1",
      apiToken: "test-token",
      bootId: "test",
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.__TESTHUB_RUNTIME__ = undefined;
  });

  it("发送 GET 请求并返回 JSON", async () => {
    const data = { id: 1, name: "test" };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });

    const result = await apiRequest("/projects");
    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/projects",
      expect.objectContaining({
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-testhub-token": "test-token",
        }),
      })
    );
  });

  it("拼接查询参数", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await apiRequest("/projects", { query: { page: 1, pageSize: 20 } });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).toContain("pageSize=20");
  });

  it("忽略 undefined 查询参数", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await apiRequest("/projects", { query: { page: 1, status: undefined } });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("page=1");
    expect(url).not.toContain("status");
  });

  it("响应非 ok 时抛出错误", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ error: "项目不存在" }),
    });

    await expect(apiRequest("/projects/999")).rejects.toThrow("项目不存在");
  });

  it("响应非 ok 且 JSON 解析失败时使用 statusText", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(apiRequest("/fail")).rejects.toThrow("Internal Server Error");
  });

  it("204 响应返回 undefined", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await apiRequest("/projects/1", { method: "DELETE" });
    expect(result).toBeUndefined();
  });
});
