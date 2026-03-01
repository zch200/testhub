import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

interface NameForm {
  name: string;
}

interface DirectoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  defaultName?: string;
  title?: string;
  description?: string;
  onSubmit: (name: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function DirectoryFormDialog({
  open,
  onOpenChange,
  mode,
  defaultName = "",
  title = mode === "create" ? "新建目录" : "重命名目录",
  description =
    mode === "create"
      ? "在用例库中新建目录。"
      : "修改目录名称。",
  onSubmit,
  loading,
  error: submitError,
  className
}: DirectoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NameForm>({
    defaultValues: { name: defaultName }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset({ name: defaultName });
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("shadow-xl border-border/80", className)}>
        <form
          onSubmit={handleSubmit((values) => {
            onSubmit(values.name.trim());
          })}
        >
          <DialogHeader>
            <DialogTitle className="tracking-tight">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dir-name">名称</Label>
              <Input
                id="dir-name"
                placeholder="如：回归测试"
                autoFocus
                {...register("name", {
                  required: "请填写名称",
                  maxLength: { value: 120, message: "最多 120 个字符" }
                })}
                className="transition-colors focus:ring-2 focus:ring-primary/20"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中…" : mode === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
