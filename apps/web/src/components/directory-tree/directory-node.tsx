import {
  CaretDown,
  CaretRight,
  Folder,
  FolderOpen
} from "@phosphor-icons/react";
import type { DirectoryTreeNode } from "../../api/directories";
import { cn } from "../../lib/utils";

const INDENT_PX = 20;

interface DirectoryNodeProps {
  node: DirectoryTreeNode;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (id: number) => void;
  onToggleExpand: (id: number) => void;
}

export function DirectoryNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand
}: DirectoryNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const paddingLeft = depth * INDENT_PX;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-0.5 min-h-8 rounded-md cursor-pointer select-none",
          "transition-[background-color,color] duration-200 ease-out",
          "hover:bg-accent/70",
          isSelected && "bg-primary/12 text-primary font-medium ring-inset ring-1 ring-primary/20"
        )}
        style={{ paddingLeft: `${paddingLeft + 4}px`, paddingRight: 4 }}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          className={cn(
            "shrink-0 p-0.5 rounded hover:bg-background/60 transition-opacity",
            !hasChildren && "invisible"
          )}
          aria-label={isExpanded ? "收起" : "展开"}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <CaretDown className="h-4 w-4 text-muted-foreground" weight="bold" />
            ) : (
              <CaretRight className="h-4 w-4 text-muted-foreground" weight="bold" />
            )
          ) : (
            <span className="w-4 inline-block" />
          )}
        </button>
        <span className="shrink-0 mr-1.5 flex items-center">
          {hasChildren && isExpanded ? (
            <FolderOpen className="h-4 w-4 text-amber-600/90" weight="duotone" />
          ) : (
            <Folder className="h-4 w-4 text-amber-600/80" weight="duotone" />
          )}
        </span>
        <span className="flex-1 truncate text-sm">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="animate-in fade-in-0 duration-150">
          {node.children.map((child) => (
            <DirectoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
