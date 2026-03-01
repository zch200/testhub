import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";

interface TextEditorFields {
  textContent?: string;
  textExpected?: string;
}

interface CaseTextEditorProps {
  register: UseFormRegister<TextEditorFields>;
  errors: FieldErrors<TextEditorFields>;
  className?: string;
}

export function CaseTextEditor({
  register,
  errors,
  className
}: CaseTextEditorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="case-textContent">正文内容</Label>
        <Textarea
          id="case-textContent"
          placeholder="描述测试内容、操作与预期…"
          rows={8}
          className="resize-y min-h-[120px] font-mono text-sm bg-muted/30 border-border/80 focus:ring-2 focus:ring-primary/20"
          {...register("textContent")}
        />
        {errors.textContent && (
          <p className="text-sm text-destructive">
            {errors.textContent.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="case-textExpected">预期结果（可选）</Label>
        <Textarea
          id="case-textExpected"
          placeholder="预期结果说明"
          rows={3}
          className="resize-y min-h-[60px] font-mono text-sm bg-muted/30 border-border/80"
          {...register("textExpected")}
        />
        {errors.textExpected && (
          <p className="text-sm text-destructive">
            {errors.textExpected.message}
          </p>
        )}
      </div>
    </div>
  );
}
