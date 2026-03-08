import { useCallback, useMemo, useState } from "react";
import { Folder } from "@phosphor-icons/react";
import { useDirectoryTree as useDirectoryTreeQuery } from "../../api/directories";
import { DirectoryNode } from "./directory-node";
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

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
