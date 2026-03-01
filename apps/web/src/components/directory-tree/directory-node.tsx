import {
  CaretDown,
  CaretRight,
  DotsThreeVertical,
  Folder,
  FolderOpen,
  PencilSimple,
  Trash,
  ArrowsLeftRight,
  Plus
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
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
  onNewSub: (parentId: number) => void;
  onRename: (id: number, name: string) => void;
  onMove: (id: number) => void;
  onDelete: (id: number) => void;
}

export function DirectoryNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onNewSub,
  onRename,
  onMove,
  onDelete
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsThreeVertical className="h-4 w-4" weight="bold" />
              <span className="sr-only">操作</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onNewSub(node.id);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              新建子目录
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename(node.id, node.name);
              }}
            >
              <PencilSimple className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMove(node.id);
              }}
            >
              <ArrowsLeftRight className="mr-2 h-4 w-4" />
              移动
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              onNewSub={onNewSub}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
