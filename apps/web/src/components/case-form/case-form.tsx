import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Case, CreateCaseInput, UpdateCaseInput } from "@testhub/shared";
import { createCaseSchema } from "@testhub/shared";
import type { Resolver } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { CaseTextEditor } from "./case-text-editor";
import { CaseStepsEditor } from "./case-steps-editor";
import { TagMultiSelect } from "./tag-multi-select";
import { cn } from "../../lib/utils";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

const priorityOptions = ["P0", "P1", "P2", "P3"] as const;
const caseTypeOptions = [
  "functional",
  "performance",
  "api",
  "ui",
  "other"
] as const;

/** 表单内部使用的完整值类型（与 createCaseSchema 兼容） */
interface CaseFormValues {
  title: string;
  precondition: string;
  contentType: "text" | "step";
  textContent: string;
  textExpected: string;
  priority: "P0" | "P1" | "P2" | "P3";
  caseType: "functional" | "performance" | "api" | "ui" | "other";
  directoryId: number | null;
  tags: string[];
  steps: Array<{ stepOrder: number; action: string; expected?: string }>;
}

export interface DirectoryOption {
  value: number | null;
  label: string;
}

interface CaseFormProps {
  mode: "create" | "edit";
  libraryId: number;
  directoryOptions: DirectoryOption[];
  initialData?: Case | null;
  onSubmit: (data: CreateCaseInput | UpdateCaseInput) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function CaseForm({
  mode,
  libraryId,
  directoryOptions,
  initialData,
  onSubmit,
  onCancel,
  loading,
  className
}: CaseFormProps) {
  const isEdit = mode === "edit";

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(createCaseSchema) as Resolver<CaseFormValues>,
    defaultValues: isEdit && initialData
      ? {
          title: initialData.title,
          precondition: initialData.precondition ?? "",
          contentType: initialData.contentType,
          textContent: initialData.textContent ?? "",
          textExpected: initialData.textExpected ?? "",
          priority: initialData.priority,
          caseType: initialData.caseType,
          directoryId: initialData.directoryId,
          tags: initialData.tags ?? [],
          steps:
            initialData.steps?.map(
              (s: { stepOrder: number; action: string; expected?: string }) =>
                ({
                  stepOrder: s.stepOrder,
                  action: s.action,
                  expected: s.expected ?? ""
                })
            ) ?? []
        }
      : {
          title: "",
          precondition: "",
          contentType: "text",
          textContent: "",
          textExpected: "",
          priority: "P1",
          caseType: "functional",
          directoryId: null,
          tags: [],
          steps: []
        }
  });

  const contentType = form.watch("contentType");

  useEffect(() => {
    if (!isEdit) return;
    if (!initialData) return;
    form.reset({
      title: initialData.title,
      precondition: initialData.precondition ?? "",
      contentType: initialData.contentType,
      textContent: initialData.textContent ?? "",
      textExpected: initialData.textExpected ?? "",
      priority: initialData.priority,
      caseType: initialData.caseType,
      directoryId: initialData.directoryId,
      tags: initialData.tags ?? [],
      steps:
        initialData.steps?.map(
          (s: { stepOrder: number; action: string; expected?: string }) => ({
            stepOrder: s.stepOrder,
            action: s.action,
            expected: s.expected ?? ""
          })
        ) ?? []
    });
  }, [isEdit, initialData?.id, form.reset]);

  const handleSubmit = form.handleSubmit((data: CaseFormValues) => {
    if (isEdit) {
      const payload: UpdateCaseInput = {
        title: data.title,
        precondition: data.precondition ?? undefined,
        contentType: data.contentType,
        priority: data.priority,
        caseType: data.caseType,
        directoryId: data.directoryId ?? undefined,
        tags: data.tags ?? []
      };
      if (data.contentType === "text") {
        payload.textContent = data.textContent ?? undefined;
        payload.textExpected = data.textExpected ?? undefined;
        payload.steps = [];
    } else {
      payload.steps = (data.steps ?? []).map(
        (s: { stepOrder: number; action: string; expected?: string }, i: number) => ({
          stepOrder: i + 1,
          action: s.action,
          expected: s.expected
        })
      );
    }
      onSubmit(payload);
      return;
    }
    const payload: CreateCaseInput = {
      title: data.title,
      precondition: data.precondition || undefined,
      contentType: data.contentType,
      priority: data.priority,
      caseType: data.caseType,
      directoryId: data.directoryId ?? undefined,
      tags: data.tags ?? [],
      steps: (data.steps ?? []).map(
        (s: { stepOrder: number; action: string; expected?: string }, i: number) => ({
          stepOrder: i + 1,
          action: s.action,
          expected: s.expected
        })
      )
    };
    if (data.contentType === "text") {
      payload.textContent = data.textContent ?? "";
      payload.textExpected = data.textExpected ?? "";
    } else {
      payload.steps = (data.steps ?? []).map(
        (s: { stepOrder: number; action: string; expected?: string }, i: number) => ({
          stepOrder: i + 1,
          action: s.action,
          expected: s.expected
        })
      );
    }
    onSubmit(payload as CreateCaseInput);
  });

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="case-title">标题</Label>
          <Input
            id="case-title"
            placeholder="用例标题"
            className="font-medium"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="case-directoryId">所属目录</Label>
          <Select
            value={
              form.watch("directoryId") == null
                ? "none"
                : String(form.watch("directoryId"))
            }
            onValueChange={(v) =>
              form.setValue("directoryId", v === "none" ? null : Number(v))
            }
          >
            <SelectTrigger id="case-directoryId">
              <SelectValue placeholder="未分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分类</SelectItem>
              {directoryOptions
                .filter((o) => o.value != null)
                .map((opt) => (
                  <SelectItem key={opt.value!} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="case-priority">优先级</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) =>
              form.setValue("priority", v as "P0" | "P1" | "P2" | "P3")
            }
          >
            <SelectTrigger id="case-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="case-caseType">类型</Label>
          <Select
            value={form.watch("caseType")}
            onValueChange={(v) =>
              form.setValue("caseType", v as CreateCaseInput["caseType"])
            }
          >
            <SelectTrigger id="case-caseType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {caseTypeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {caseTypeLabels[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="case-contentType">内容形式</Label>
          <Select
            value={form.watch("contentType")}
            onValueChange={(v) =>
              form.setValue("contentType", v as "text" | "step")
            }
          >
            <SelectTrigger id="case-contentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">文本描述</SelectItem>
              <SelectItem value="step">步骤列表</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="case-precondition">前置条件（可选）</Label>
          <Textarea
            id="case-precondition"
            placeholder="前置条件说明"
            rows={2}
            className="resize-y bg-muted/30"
            {...form.register("precondition")}
          />
        </div>
      </div>

      {contentType === "text" ? (
        <CaseTextEditor
          register={form.register as unknown as import("react-hook-form").UseFormRegister<{
            textContent?: string;
            textExpected?: string;
          }>}
          errors={form.formState.errors}
        />
      ) : (
        <CaseStepsEditor
          form={form as unknown as import("react-hook-form").UseFormReturn<{
            steps: Array<{
              stepOrder: number;
              action: string;
              expected?: string;
            }>;
          }>}
        />
      )}

      <TagMultiSelect
        libraryId={libraryId}
        value={form.watch("tags") ?? []}
        onChange={(tags) => form.setValue("tags", tags)}
      />

      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : isEdit ? "保存" : "创建"}
        </Button>
      </div>
    </form>
  );
}
