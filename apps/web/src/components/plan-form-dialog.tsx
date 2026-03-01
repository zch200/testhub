import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { createPlanSchema } from "@testhub/shared";
import type { CreatePlanInput, Plan, UpdatePlanInput } from "@testhub/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";

const planStatusOptions = [
  { value: "draft", label: "草稿" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" }
] as const;

type PlanFormValues = CreatePlanInput;

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  projectId: number;
  plan?: Plan | null;
  onSubmit: (values: CreatePlanInput | UpdatePlanInput) => void;
  loading?: boolean;
  error?: string;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  mode,
  projectId: _projectId,
  plan,
  onSubmit,
  loading,
  error: submitError
}: PlanFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PlanFormValues>({
    resolver: zodResolver(createPlanSchema) as Resolver<PlanFormValues>,
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      status: "draft"
    }
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && plan) {
      reset({
        name: plan.name,
        description: plan.description ?? "",
        startDate: plan.startDate ?? undefined,
        endDate: plan.endDate ?? undefined,
        status: plan.status
      });
    } else {
      reset({
        name: "",
        description: "",
        startDate: undefined,
        endDate: undefined,
        status: "draft"
      });
    }
  }, [open, mode, plan, reset]);

  const status = watch("status");

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFormSubmit = (values: PlanFormValues) => {
    if (mode === "edit" && plan) {
      const payload: UpdatePlanInput = {};
      if (values.name !== undefined) payload.name = values.name;
      if (values.description !== undefined) payload.description = values.description || undefined;
      if (values.startDate !== undefined) payload.startDate = values.startDate || undefined;
      if (values.endDate !== undefined) payload.endDate = values.endDate || undefined;
      if (values.status !== undefined) payload.status = values.status;
      onSubmit(payload);
    } else {
      onSubmit({
        name: values.name,
        description: values.description?.trim() || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        status: values.status ?? "draft"
      } as CreatePlanInput);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form
          onSubmit={handleSubmit((data) => onFormSubmit(data as PlanFormValues))}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "新建测试计划" : "编辑计划"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "创建测试计划以组织用例执行与统计。"
                : "更新计划名称、日期与状态。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">名称</Label>
              <Input
                id="plan-name"
                placeholder="例如：v1.0 回归测试"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-description">描述（选填）</Label>
              <Textarea
                id="plan-description"
                placeholder="计划说明与范围"
                className="min-h-[80px] resize-y"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-start">开始日期</Label>
                <Input
                  id="plan-start"
                  type="date"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-end">结束日期</Label>
                <Input id="plan-end" type="date" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-sm text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select
                value={status ?? "draft"}
                onValueChange={(v) =>
                  setValue("status", v as PlanFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {planStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "保存中…"
                : mode === "create"
                  ? "创建"
                  : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
