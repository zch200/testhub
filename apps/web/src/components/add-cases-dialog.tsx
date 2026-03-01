import { useState, useCallback } from "react";
import { Books, ListChecks } from "@phosphor-icons/react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { DirectoryTree } from "./directory-tree/directory-tree";
import { CaseFilters, type CaseFiltersValue } from "./case-filters";
import { PriorityBadge } from "./priority-badge";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useLibraries } from "../api/libraries";
import { useCases } from "../api/cases";
import { useAddPlanCases } from "../api/plan-cases";
import { cn } from "../lib/utils";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

interface AddCasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: number;
  projectId: number;
}

export function AddCasesDialog({
  open,
  onOpenChange,
  planId,
  projectId
}: AddCasesDialogProps) {
  const [libraryId, setLibraryId] = useState<number | null>(null);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(
    null
  );
  const [filters, setFilters] = useState<CaseFiltersValue>({});
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<number>>(
    () => new Set()
  );

  const libraries = useLibraries(projectId);
  const casesQuery = useCases(libraryId ?? 0, {
    directoryId: selectedDirectoryId ?? undefined,
    priority: filters.priority || undefined,
    type: filters.type || undefined,
    tag: filters.tag,
    keyword: filters.keyword
  });
  const addPlanCases = useAddPlanCases(planId);

  const caseList = casesQuery.data?.items ?? [];
  const isLoadingCases = libraryId != null && casesQuery.isLoading;

  const toggleCase = useCallback((caseId: number) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedCaseIds.size === caseList.length) {
      setSelectedCaseIds(new Set());
    } else {
      setSelectedCaseIds(new Set(caseList.map((c) => c.id)));
    }
  }, [caseList, selectedCaseIds.size]);

  const selectAllChecked: boolean | "indeterminate" =
    caseList.length > 0 && selectedCaseIds.size === caseList.length
      ? true
      : caseList.length > 0 && selectedCaseIds.size > 0
        ? "indeterminate"
        : false;

  const handleAdd = useCallback(() => {
    const ids = Array.from(selectedCaseIds);
    if (ids.length === 0) return;
    addPlanCases.mutate(
      { caseIds: ids },
      {
        onSuccess: (data) => {
          const added = data.added?.length ?? 0;
          const skipped = data.skipped?.length ?? 0;
          if (skipped > 0) {
            setSelectedCaseIds((prev) => {
              const next = new Set(prev);
              data.skipped?.forEach((id) => next.delete(id));
              return next;
            });
          }
          if (added > 0) {
            setSelectedCaseIds(new Set());
            onOpenChange(false);
          }
        }
      }
    );
  }, [selectedCaseIds, addPlanCases, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setLibraryId(null);
        setSelectedDirectoryId(null);
        setFilters({});
        setSelectedCaseIds(new Set());
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const libraryOptions = libraries.data?.items ?? [];
  const hasSelection = selectedCaseIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/80 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" weight="duotone" />
            向计划添加用例
          </DialogTitle>
          <DialogDescription>
            选择用例库后，在右侧勾选用例并点击「添加选中项」加入当前计划。
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Books className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-sm font-medium text-muted-foreground">
              选择用例库
            </span>
            <Select
              value={libraryId?.toString() ?? ""}
              onValueChange={(v) => {
                setLibraryId(v ? Number(v) : null);
                setSelectedDirectoryId(null);
                setFilters({});
                setSelectedCaseIds(new Set());
              }}
            >
              <SelectTrigger className="w-[260px]">
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
        </div>

        {libraryId != null && (
          <div className="flex-1 min-h-0 flex border-t border-border/80">
            <div className="w-[260px] shrink-0 border-r border-border/80 flex flex-col overflow-hidden">
              <div className="px-2 py-2 border-b border-border/60 text-xs font-medium text-muted-foreground">
                目录
              </div>
              <ScrollArea className="flex-1">
                <DirectoryTree
                  libraryId={libraryId}
                  selectedId={selectedDirectoryId}
                  onSelect={setSelectedDirectoryId}
                  className="border-0 rounded-none shadow-none min-h-[200px]"
                />
              </ScrollArea>
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <CaseFilters
                libraryId={libraryId}
                value={filters}
                onChange={setFilters}
                className="px-4 border-b border-border/60"
              />
              <ScrollArea className="flex-1 min-h-[280px]">
                {isLoadingCases ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    加载用例中…
                  </div>
                ) : caseList.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    该目录下暂无用例，可切换目录或清除筛选。
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 pr-0">
                          <Checkbox
                            checked={selectAllChecked}
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead className="w-20">优先级</TableHead>
                        <TableHead className="w-20">类型</TableHead>
                        <TableHead className="w-[180px]">标签</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseList.map((c) => (
                        <TableRow
                          key={c.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedCaseIds.has(c.id) && "bg-primary/6"
                          )}
                          onClick={() => toggleCase(c.id)}
                        >
                          <TableCell className="w-12 pr-0" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedCaseIds.has(c.id)}
                              onCheckedChange={() => toggleCase(c.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {c.title}
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={c.priority} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {caseTypeLabels[c.caseType] ?? c.caseType}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.tags?.map((name) => (
                                <Badge
                                  key={name}
                                  variant="secondary"
                                  className="text-xs font-normal"
                                >
                                  {name}
                                </Badge>
                              ))}
                              {(!c.tags || c.tags.length === 0) && (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </div>
          </div>
        )}

        {libraryId == null && (
          <div className="flex-1 min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            请先选择一个用例库
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-border/80 shrink-0 flex-row justify-between sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {hasSelection ? `已选 ${selectedCaseIds.size} 个用例` : "勾选要添加的用例"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!hasSelection || addPlanCases.isPending}
            >
              {addPlanCases.isPending ? "添加中…" : "添加选中项"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
