import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "../../components/priority-badge";

describe("PriorityBadge", () => {
  it("渲染 P0 优先级", () => {
    render(<PriorityBadge priority="P0" />);
    expect(screen.getByText("P0")).toBeInTheDocument();
  });

  it("渲染 P1 优先级", () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("渲染 P2 优先级", () => {
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByText("P2")).toBeInTheDocument();
  });

  it("渲染 P3 优先级", () => {
    render(<PriorityBadge priority="P3" />);
    expect(screen.getByText("P3")).toBeInTheDocument();
  });

  it("未知优先级直接显示原始值", () => {
    render(<PriorityBadge priority="P9" />);
    expect(screen.getByText("P9")).toBeInTheDocument();
  });

  it("接受自定义 className", () => {
    const { container } = render(<PriorityBadge priority="P0" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
