import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../../components/status-badge";

describe("StatusBadge", () => {
  it.each([
    ["pending", "待执行"],
    ["passed", "通过"],
    ["failed", "失败"],
    ["blocked", "阻塞"],
    ["skipped", "跳过"],
  ])("渲染 %s 状态为 '%s'", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("未知状态直接显示原始值", () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("接受自定义 className", () => {
    const { container } = render(<StatusBadge status="passed" className="my-class" />);
    expect(container.firstChild).toHaveClass("my-class");
  });
});
