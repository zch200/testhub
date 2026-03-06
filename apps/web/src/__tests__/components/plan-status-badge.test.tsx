import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanStatusBadge } from "../../components/plan-status-badge";

describe("PlanStatusBadge", () => {
  it.each([
    ["draft", "草稿"],
    ["in_progress", "进行中"],
    ["completed", "已完成"],
    ["archived", "已归档"],
  ])("渲染 %s 状态为 '%s'", (status, label) => {
    render(<PlanStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("未知状态直接显示原始值", () => {
    render(<PlanStatusBadge status="cancelled" />);
    expect(screen.getByText("cancelled")).toBeInTheDocument();
  });

  it("接受自定义 className", () => {
    const { container } = render(<PlanStatusBadge status="draft" className="extra" />);
    expect(container.firstChild).toHaveClass("extra");
  });
});
