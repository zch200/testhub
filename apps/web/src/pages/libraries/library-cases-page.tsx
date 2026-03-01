import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpenText, Plus } from "@phosphor-icons/react";
import { useLibrary } from "../../api/libraries";
import { useCases, useCreateCase } from "../../api/cases";
import { useDirectoryTree } from "../../api/directories";
import { DirectoryTree } from "../../components/directory-tree/directory-tree";
import { TagManager } from "../../components/tag-manager";
import { CaseForm, type DirectoryOption } from "../../components/case-form";
import { CaseDetailSheet } from "../../components/case-detail-sheet";
import { CaseFilters, type CaseFiltersValue } from "../../components/case-filters";
import { PriorityBadge } from "../../components/priority-badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "../../components/loading-spinner";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

function flattenDirectories(
  nodes: Array<{ id: number; name: string; children: Array<unknown> }>,
  depth = 0
): DirectoryOption[] {
  const options: DirectoryOption[] = [];
  for (const node of nodes) {
    options.push({
      value: node.id,
      label: "　".repeat(depth) + node.name
    });
    if (node.children?.length) {
      options.push(
        ...flattenDirectories(
          node.children as Array<{
            id: number;
            name: string;
            children: Array<unknown>;
          }>,
          depth + 1
        )
      );
    }
  }
  return options;
}

export function LibraryCasesPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const libraryId = Number(params.libraryId);

  const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(
    null
  );
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [filters, setFilters] = useState<CaseFiltersValue>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const library = useLibrary(libraryId);
  const { data: treeData } = useDirectoryTree(libraryId);
  const casesQuery = useCases(libraryId, {
    directoryId: selectedDirectoryId ?? undefined,
    priority: filters.priority || undefined,
    type: filters.type || undefined,
    tag: filters.tag,
    keyword: filters.keyword
  });
  const createCase = useCreateCase(libraryId);

  const libraryName = library.data?.name ?? `用例库 ${libraryId}`;
  const cases = casesQuery.data?.items ?? [];
  const casesLoading = casesQuery.isLoading;
  const casesError = casesQuery.error;

  const directoryOptions = useMemo(() => {
    const tree = treeData ?? [];
    const flat: DirectoryOption[] = [{ value: null, label: "未分类" }];
    flat.push(...flattenDirectories(tree));
    return flat;
  }, [treeData]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 flex items-center justify-between gap-4 py-4 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">返回项目</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight truncate flex items-center gap-2">
              <BookOpenText
                className="h-5 w-5 text-primary/80 shrink-0"
                weight="duotone"
              />
              {libraryName}
            </h2>
            <p className="text-sm text-muted-foreground">
              用例 · 左侧目录树与标签，右侧列表与详情
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" weight="bold" />
            新建用例
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-4">
        <aside
          className={cn(
            "w-[260px] shrink-0 flex flex-col min-h-0",
            "rounded-xl overflow-hidden"
          )}
        >
          <DirectoryTree
            libraryId={libraryId}
            selectedId={selectedDirectoryId}
            onSelect={setSelectedDirectoryId}
            className="flex-1 min-h-0"
          />
          <div className="mt-3">
            <TagManager libraryId={libraryId} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col rounded-xl border border-border/80 bg-card/50 overflow-hidden shadow-sm">
          <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4">
            <CaseFilters
              libraryId={libraryId}
              value={filters}
              onChange={setFilters}
            />
          </div>
          <div className="flex-1 overflow-auto">
            {casesLoading && (
              <LoadingSpinner label="加载用例中…" className="py-12" />
            )}
            {casesError && (
              <div className="p-8 text-center text-destructive text-sm">
                {casesError.message}
              </div>
            )}
            {!casesLoading && !casesError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">标题</TableHead>
                    <TableHead className="w-[80px]">优先级</TableHead>
                    <TableHead className="w-[80px]">类型</TableHead>
                    <TableHead className="w-[120px]">标签</TableHead>
                    <TableHead className="w-[70px]">版本</TableHead>
                    <TableHead className="w-[100px] text-muted-foreground">
                      更新
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer transition-all duration-200 hover:bg-primary/5 hover:shadow-[inset_0_1px_0_0_hsl(var(--border))]"
                      onClick={() => setSelectedCaseId(item.id)}
                    >
                      <TableCell className="font-medium align-top py-3">
                        <span className="line-clamp-2">{item.title}</span>
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <PriorityBadge priority={item.priority} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground align-top py-3">
                        {caseTypeLabels[item.caseType] ?? item.caseType}
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs font-normal truncate max-w-[36px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground align-top py-3">
                        v{item.latestVersionNo}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground align-top py-3">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {cases.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-12"
                      >
                        暂无用例。点击「新建用例」创建，或调整筛选条件。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>

      <CaseDetailSheet
        caseId={selectedCaseId}
        libraryId={libraryId}
        open={selectedCaseId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedCaseId(null);
        }}
        onCaseUpdated={() => {
          void casesQuery.refetch();
        }}
        onCaseDeleted={() => {
          setSelectedCaseId(null);
          void casesQuery.refetch();
        }}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>新建用例</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            <CaseForm
              mode="create"
              libraryId={libraryId}
              directoryOptions={directoryOptions}
              onSubmit={(payload) => {
                createCase.mutate(payload as import("@testhub/shared").CreateCaseInput, {
                  onSuccess: () => {
                    setCreateDialogOpen(false);
                    void casesQuery.refetch();
                  }
                });
              }}
              onCancel={() => setCreateDialogOpen(false)}
              loading={createCase.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
