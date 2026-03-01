import { useState } from "react";
import { Plus, Tag as TagIcon, Trash } from "@phosphor-icons/react";
import { useTags, useCreateTag, useDeleteTag } from "../api/tags";
import type { Tag } from "@testhub/shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ConfirmDialog } from "./confirm-dialog";
import { cn } from "../lib/utils";

interface TagManagerProps {
  libraryId: number;
  className?: string;
}

export function TagManager({ libraryId, className }: TagManagerProps) {
  const { data, isLoading, error } = useTags(libraryId);
  const createTag = useCreateTag(libraryId);
  const deleteTag = useDeleteTag(libraryId);

  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

  const tags = data?.items ?? [];

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createTag.mutate(
      { name },
      {
        onSuccess: () => setNewName("")
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteTag.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null)
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden ring-1 ring-black/[0.02]",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" weight="duotone" />
        <span className="text-sm font-medium">标签</span>
      </div>
      <div className="p-3 space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">加载标签中…</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {!isLoading && !error && (
          <>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  暂无标签。
                </span>
              )}
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className={cn(
                    "group gap-1 pr-1 py-1 transition-all duration-200",
                    "hover:bg-secondary/90 hover:scale-[1.02]"
                  )}
                >
                  <span className="text-xs">{tag.name}</span>
                  <button
                    type="button"
                    className="opacity-60 hover:opacity-100 hover:text-destructive transition-opacity rounded p-0.5"
                    onClick={() => setDeleteTarget(tag)}
                    aria-label={`删除标签 ${tag.name}`}
                  >
                    <Trash className="h-3 w-3" weight="bold" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="新标签名称"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={handleCreate}
                disabled={!newName.trim() || createTag.isPending}
              >
                <Plus className="h-4 w-4 mr-1" weight="bold" />
                添加
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除标签"
        description={
          deleteTarget
            ? `确定移除标签「${deleteTarget.name}」吗？相关用例将不再带有该标签。`
            : ""
        }
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteTag.isPending}
      />
    </div>
  );
}
