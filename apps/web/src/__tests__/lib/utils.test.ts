import { describe, it, expect } from "vitest";
import { cn } from "../../lib/utils";

describe("cn", () => {
  it("合并多个类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("过滤 falsy 值", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("条件类名", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });

  it("Tailwind 冲突类合并 (twMerge)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-red-100 text-red-700", "bg-blue-100")).toBe("text-red-700 bg-blue-100");
  });

  it("空输入返回空字符串", () => {
    expect(cn()).toBe("");
  });
});
