import { useMemo } from "react";
import type { DirectoryTreeNode } from "../../api/directories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

function flattenWithDepth(
  nodes: DirectoryTreeNode[],
  depth: number,
  excludeId: number | null,
  descendantIds: Set<number>,
  out: { id: number; name: string; depth: number }[] = []
): { id: number; name: string; depth: number }[] {
  for (const node of nodes) {
    if (excludeId !== null && (node.id === excludeId || descendantIds.has(node.id)))
      continue;
    out.push({ id: node.id, name: node.name, depth });
    flattenWithDepth(node.children, depth + 1, excludeId, descendantIds, out);
  }
  return out;
}

function collectDescendantIds(node: DirectoryTreeNode, out: Set<number>): void {
  for (const child of node.children) {
    out.add(child.id);
    collectDescendantIds(child, out);
  }
}

interface MoveDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: DirectoryTreeNode[];
  currentDirectoryId: number;
  onMove: (targetParentId: number | null) => void;
  loading?: boolean;
  className?: string;
}

export function MoveDirectoryDialog({
  open,
  onOpenChange,
  tree,
  currentDirectoryId,
  onMove,
  loading,
  className
}: MoveDirectoryDialogProps) {
  const current = useMemo(() => {
    const visit = (nodes: DirectoryTreeNode[]): DirectoryTreeNode | null => {
      for (const n of nodes) {
        if (n.id === currentDirectoryId) return n;
        const found = visit(n.children);
        if (found) return found;
      }
      return null;
    };
    return visit(tree);
  }, [tree, currentDirectoryId]);

  const descendantIds = useMemo(() => {
    const set = new Set<number>();
    if (current) collectDescendantIds(current, set);
    return set;
  }, [current]);

  const options = useMemo(
    () =>
      flattenWithDepth(
        tree,
        0,
        currentDirectoryId,
        descendantIds
      ),
    [tree, currentDirectoryId, descendantIds]
  );

  const handleSelect = (parentId: number | null) => {
    onMove(parentId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm shadow-xl border-border/80 max-h-[70vh] flex flex-col",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="tracking-tight">移动目录</DialogTitle>
          <DialogDescription>
            选择目标父目录，当前目录及其子目录将一并移动。
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 py-2 -mx-1 px-1 space-y-0.5">
          <Button
            variant="ghost"
            className="w-full justify-start font-normal h-9 text-left"
            onClick={() => handleSelect(null)}
            disabled={loading}
          >
            <span className="pl-2">库根目录</span>
          </Button>
          {options.map((opt) => (
            <Button
              key={opt.id}
              variant="ghost"
              className={cn(
                "w-full justify-start font-normal h-9 text-left transition-colors",
                "hover:bg-accent/80"
              )}
              style={{ paddingLeft: `${12 + opt.depth * 16}px` }}
              onClick={() => handleSelect(opt.id)}
              disabled={loading}
            >
              {opt.name}
            </Button>
          ))}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              暂无其他可选目录。
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
