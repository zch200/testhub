import { useCallback, useMemo, useState } from "react";
import { Folder, Plus } from "@phosphor-icons/react";
import { useDirectoryTree as useDirectoryTreeQuery, useCreateDirectory, useUpdateDirectory, useDeleteDirectory } from "../../api/directories";
import { Button } from "../ui/button";
import { DirectoryNode } from "./directory-node";
import { DirectoryFormDialog } from "./directory-form-dialog";
import { MoveDirectoryDialog } from "./move-directory-dialog";
import { ConfirmDialog } from "../confirm-dialog";
import { cn } from "../../lib/utils";

interface DirectoryTreeProps {
  libraryId: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  className?: string;
}

export function DirectoryTree({
  libraryId,
  selectedId,
  onSelect,
  className
}: DirectoryTreeProps) {
  const { data: tree = [], isLoading, error } = useDirectoryTreeQuery(libraryId);
  const createDir = useCreateDirectory(libraryId);
  const updateDir = useUpdateDirectory(libraryId);
  const deleteDir = useDeleteDirectory(libraryId);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandParent = useCallback((parentId: number | null) => {
    if (parentId !== null)
      setExpandedIds((prev) => new Set(prev).add(parentId));
  }, []);

  const [formState, setFormState] = useState<
    | { type: "create"; parentId: number | null }
    | { type: "rename"; id: number; name: string }
    | null
  >(null);
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleCreate = useCallback(
    (name: string) => {
      const parentId = formState?.type === "create" ? formState.parentId ?? undefined : undefined;
      createDir.mutate(
        { name: name.trim(), parentId: parentId ?? null, sortOrder: 0 },
        {
          onSuccess: () => {
            setFormState(null);
            if (parentId != null) expandParent(parentId);
          }
        }
      );
    },
    [formState, createDir, expandParent]
  );

  const handleRename = useCallback(
    (name: string) => {
      if (formState?.type !== "rename") return;
      updateDir.mutate(
        { id: formState.id, name: name.trim() },
        { onSuccess: () => setFormState(null) }
      );
    },
    [formState, updateDir]
  );

  const handleMoveConfirm = useCallback(
    (targetParentId: number | null) => {
      if (moveTargetId === null) return;
      updateDir.mutate(
        { id: moveTargetId, parentId: targetParentId },
        { onSuccess: () => setMoveTargetId(null) }
      );
    },
    [moveTargetId, updateDir]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetId === null) return;
    deleteDir.mutate(
      { id: deleteTargetId, caseMoveTo: "uncategorized" },
      {
        onSuccess: () => {
          setDeleteTargetId(null);
          if (selectedId === deleteTargetId) onSelect(null);
        }
      }
    );
  }, [deleteTargetId, deleteDir, selectedId, onSelect]);

  const initialExpand = useMemo(() => {
    const set = new Set<number>();
    tree.forEach((n) => set.add(n.id));
    return set;
  }, [tree]);

  if (isLoading) {
    return (
      <div className={cn("p-4 text-muted-foreground text-sm", className)}>
        加载目录中…
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 text-destructive text-sm", className)}>
        {error.message}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden",
        "ring-1 ring-black/[0.02]",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-2 min-h-9 px-3 rounded-lg text-left",
            "transition-[background-color,color] duration-200 ease-out",
            "hover:bg-accent/70",
            selectedId === null && "bg-primary/12 text-primary font-medium ring-inset ring-1 ring-primary/20"
          )}
        >
          <Folder className="h-4 w-4 text-primary/80" weight="duotone" />
          <span className="text-sm truncate">全部用例</span>
        </button>

        {tree.length > 0 && (
          <div className="mt-0.5 border-t border-border/60 pt-0.5">
            {tree.map((node) => (
              <DirectoryNode
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                expandedIds={expandedIds.size > 0 ? expandedIds : initialExpand}
                onSelect={onSelect}
                onToggleExpand={toggleExpand}
                onNewSub={(parentId) =>
                  setFormState({ type: "create", parentId })
                }
                onRename={(id, name) =>
                  setFormState({ type: "rename", id, name })
                }
                onMove={(id) => setMoveTargetId(id)}
                onDelete={(id) => setDeleteTargetId(id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 p-2 border-t border-border/60 bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setFormState({ type: "create", parentId: null })}
        >
          <Plus className="h-4 w-4" weight="bold" />
          新建目录
        </Button>
      </div>

      {formState?.type === "create" && (
        <DirectoryFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setFormState(null);
          }}
          mode="create"
          defaultName=""
          onSubmit={handleCreate}
          loading={createDir.isPending}
          error={createDir.error?.message}
        />
      )}

      {formState?.type === "rename" && (
        <DirectoryFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setFormState(null);
          }}
          mode="rename"
          defaultName={formState.name}
          onSubmit={handleRename}
          loading={updateDir.isPending}
          error={updateDir.error?.message}
        />
      )}

      {moveTargetId !== null && (
        <MoveDirectoryDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setMoveTargetId(null);
          }}
          tree={tree}
          currentDirectoryId={moveTargetId}
          onMove={handleMoveConfirm}
          loading={updateDir.isPending}
        />
      )}

      {deleteTargetId !== null && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteTargetId(null);
          }}
          title="删除目录"
          description="确定删除该目录及其子目录吗？其中的用例将变为未分类，且无法恢复。"
          confirmLabel="删除"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          loading={deleteDir.isPending}
        />
      )}
    </div>
  );
}
