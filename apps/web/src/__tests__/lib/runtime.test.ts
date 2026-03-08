import { describe, it, expect, afterEach } from "vitest";
import { readRuntimeConfig } from "../../lib/runtime";

describe("readRuntimeConfig", () => {
  const originalRuntime = window.__TESTHUB_RUNTIME__;

  afterEach(() => {
    window.__TESTHUB_RUNTIME__ = originalRuntime;
  });

  it("返回默认值当 window.__TESTHUB_RUNTIME__ 不存在时", () => {
    window.__TESTHUB_RUNTIME__ = undefined;
    const config = readRuntimeConfig();
    expect(config).toEqual({
      apiBase: "/api/v1",
      apiToken: "",
      bootId: "dev",
    });
  });

  it("读取 window.__TESTHUB_RUNTIME__ 的值", () => {
    window.__TESTHUB_RUNTIME__ = {
      apiBase: "/custom/api",
      apiToken: "my-token",
      bootId: "abc123",
    };
    const config = readRuntimeConfig();
    expect(config).toEqual({
      apiBase: "/custom/api",
      apiToken: "my-token",
      bootId: "abc123",
    });
  });

  it("部分配置时使用默认值填充", () => {
    window.__TESTHUB_RUNTIME__ = { apiToken: "token-only" };
    const config = readRuntimeConfig();
    expect(config).toEqual({
      apiBase: "/api/v1",
      apiToken: "token-only",
      bootId: "dev",
    });
  });
});
