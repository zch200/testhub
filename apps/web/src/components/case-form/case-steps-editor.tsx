import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Plus, Trash } from "@phosphor-icons/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

interface StepItem {
  stepOrder: number;
  action: string;
  expected?: string;
}

interface CaseFormSteps {
  steps: StepItem[];
}

interface CaseStepsEditorProps {
  form: UseFormReturn<CaseFormSteps>;
  className?: string;
}

export function CaseStepsEditor({ form, className }: CaseStepsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps"
  });
  const errors = form.formState.errors.steps;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label>步骤</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            append({
              stepOrder: fields.length + 1,
              action: "",
              expected: ""
            })
          }
        >
          <Plus className="h-4 w-4" weight="bold" />
          添加步骤
        </Button>
      </div>

      {typeof errors?.root?.message === "string" && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
        {fields.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            暂无步骤，点击「添加步骤」开始填写。
          </p>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-2 items-start rounded-md border border-border/60 bg-background p-3 transition-colors hover:border-primary/20"
          >
            <span className="flex h-9 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">操作</Label>
                <Input
                  placeholder="操作说明"
                  className="h-9 text-sm"
                  {...form.register(`steps.${index}.action`, {
                    required: "请填写步骤说明"
                  })}
                />
                {errors?.[index]?.action && (
                  <p className="text-xs text-destructive">
                    {errors[index]?.action?.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">
                  预期（可选）
                </Label>
                <Input
                  placeholder="预期结果"
                  className="h-9 text-sm"
                  {...form.register(`steps.${index}.expected`)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                  aria-label={`删除第 ${index + 1} 步`}
                >
                  <Trash className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
