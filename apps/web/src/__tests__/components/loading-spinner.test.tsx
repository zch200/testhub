import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../../components/loading-spinner";

describe("LoadingSpinner", () => {
  it("默认渲染无标签", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it("渲染带标签文字", () => {
    render(<LoadingSpinner label="加载中..." />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("支持 sm 尺寸", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-4", "w-4");
  });

  it("支持 lg 尺寸", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  it("默认 md 尺寸", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-6", "w-6");
  });

  it("接受自定义 className", () => {
    const { container } = render(<LoadingSpinner className="my-spinner" />);
    expect(container.firstChild).toHaveClass("my-spinner");
  });
});
