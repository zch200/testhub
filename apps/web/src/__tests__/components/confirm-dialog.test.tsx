import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../../components/confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "确认删除",
    description: "此操作不可撤销",
    onConfirm: vi.fn(),
  };

  it("open 时渲染标题和描述", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("确认删除")).toBeInTheDocument();
    expect(screen.getByText("此操作不可撤销")).toBeInTheDocument();
  });

  it("closed 时不渲染内容", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("确认删除")).toBeNull();
  });

  it("显示默认按钮文案", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("确定")).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("支持自定义按钮文案", () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="删除" cancelLabel="算了" />);
    expect(screen.getByText("删除")).toBeInTheDocument();
    expect(screen.getByText("算了")).toBeInTheDocument();
  });

  it("点击确认按钮触发 onConfirm", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("确定"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("loading 时显示处理中文案", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText("处理中…")).toBeInTheDocument();
  });

  it("loading 时按钮被禁用", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText("处理中…")).toBeDisabled();
    expect(screen.getByText("取消")).toBeDisabled();
  });
});
