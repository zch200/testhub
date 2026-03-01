import { useState, useMemo, useCallback } from "react";
import { Folder, FolderOpen } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { useLibraries } from "../api/libraries";
import { useDirectoryTree } from "../api/directories";
import { useAddPlanCasesByDirectory } from "../api/plan-cases";
import type { DirectoryTreeNode } from "../api/directories";
import { Checkbox } from "./ui/checkbox";
import { cn } from "../lib/utils";

function flattenDirectories(
  nodes: DirectoryTreeNode[],
  depth: number,
  out: { id: number; name: string; depth: number }[] = []
): { id: number; name: string; depth: number }[] {
  for (const node of nodes) {
    out.push({ id: node.id, name: node.name, depth });
    flattenDirectories(node.children, depth + 1, out);
  }
  return out;
}

interface AddByDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: number;
  projectId: number;
}

export function AddByDirectoryDialog({
  open,
  onOpenChange,
  planId,
  projectId
}: AddByDirectoryDialogProps) {
  const [libraryId, setLibraryId] = useState<number | null>(null);
  const [directoryId, setDirectoryId] = useState<number | null>(null);
  const [recursive, setRecursive] = useState(true);

  const libraries = useLibraries(projectId);
  const { data: treeData = [] } = useDirectoryTree(libraryId ?? 0);
  const addByDirectory = useAddPlanCasesByDirectory(planId);

  const directoryOptions = useMemo(
    () => flattenDirectories(treeData, 0),
    [treeData]
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setLibraryId(null);
        setDirectoryId(null);
        setRecursive(true);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleSubmit = useCallback(() => {
    if (directoryId == null) return;
    addByDirectory.mutate(
      { directoryId, recursive },
      {
        onSuccess: () => {
          handleOpenChange(false);
        }
      }
    );
  }, [directoryId, recursive, addByDirectory, handleOpenChange]);

  const libraryOptions = libraries.data?.items ?? [];
  const canSubmit = directoryId != null && !addByDirectory.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" weight="duotone" />
            按目录添加用例
          </DialogTitle>
          <DialogDescription>
            选择用例库与目录后，将把该目录下{recursive ? "及子目录" : ""}的全部用例加入计划；已在计划中的用例会自动跳过。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>用例库</Label>
            <Select
              value={libraryId?.toString() ?? ""}
              onValueChange={(v) => {
                setLibraryId(v ? Number(v) : null);
                setDirectoryId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择用例库" />
              </SelectTrigger>
              <SelectContent>
                {libraryOptions.map((lib) => (
                  <SelectItem key={lib.id} value={lib.id.toString()}>
                    {lib.name}
                    {lib.code && (
                      <span className="text-muted-foreground ml-1">
                        ({lib.code})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {libraryId != null && (
            <>
              <div className="grid gap-2">
                <Label>目录</Label>
                {directoryOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    该用例库暂无目录，请先在用例管理页创建目录，或使用「添加用例」逐条添加。
                  </p>
                ) : (
                  <ScrollArea className="h-[200px] rounded-md border border-border p-2">
                    <div className="space-y-0.5">
                      {directoryOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setDirectoryId((prev) =>
                              prev === opt.id ? null : opt.id
                            )
                          }
                          className={cn(
                            "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            "border-none bg-transparent cursor-pointer",
                            "hover:bg-accent/80",
                            directoryId === opt.id &&
                              "bg-primary/12 text-primary font-medium ring-inset ring-1 ring-primary/20"
                          )}
                          style={{ paddingLeft: `${12 + opt.depth * 16}px` }}
                        >
                          <Folder
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            weight={directoryId === opt.id ? "fill" : "duotone"}
                          />
                          <span className="truncate">{opt.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recursive"
                  checked={recursive}
                  onCheckedChange={(checked) => setRecursive(checked === true)}
                />
                <Label
                  htmlFor="recursive"
                  className="text-sm font-normal cursor-pointer"
                >
                  递归包含子目录中的用例
                </Label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || directoryOptions.length === 0}
          >
            {addByDirectory.isPending ? "添加中…" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
