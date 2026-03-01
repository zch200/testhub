import { useState, useMemo } from "react";
import {
  PencilSimple,
  Trash,
  FileText,
  ListChecks
} from "@phosphor-icons/react";
import { useCase, useUpdateCase, useDeleteCase } from "../api/cases";
import { useDirectoryTree } from "../api/directories";
import { CaseForm, type DirectoryOption } from "./case-form";
import { CaseVersionHistory } from "./case-version-history";
import { CaseVersionDetail } from "./case-version-detail";
import { useCaseVersion } from "../api/cases";
import { PriorityBadge } from "./priority-badge";
import { ConfirmDialog } from "./confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

interface CaseDetailSheetProps {
  caseId: number | null;
  libraryId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseUpdated?: () => void;
  onCaseDeleted?: () => void;
}

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

export function CaseDetailSheet({
  caseId,
  libraryId,
  open,
  onOpenChange,
  onCaseUpdated,
  onCaseDeleted
}: CaseDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [selectedVersionNo, setSelectedVersionNo] = useState<number | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: caseData, isLoading: caseLoading } = useCase(caseId);
  const { data: treeData } = useDirectoryTree(libraryId);
  const updateCase = useUpdateCase(libraryId);
  const deleteCase = useDeleteCase(libraryId);
  const { data: selectedVersion } = useCaseVersion(caseId, selectedVersionNo);

  const directoryOptions = useMemo(() => {
    const tree = treeData ?? [];
    const flat: DirectoryOption[] = [{ value: null, label: "未分类" }];
    flat.push(...flattenDirectories(tree));
    return flat;
  }, [treeData]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setEditing(false);
      setSelectedVersionNo(null);
    }
    onOpenChange(next);
  };

  const handleDeleteConfirm = () => {
    if (caseId == null) return;
    deleteCase.mutate(caseId, {
      onSuccess: () => {
        handleClose(false);
        onCaseDeleted?.();
      }
    });
  };

  const caseItem = caseData ?? null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-xl overflow-hidden shadow-xl border-l border-border/80"
      >
        {caseLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            加载中…
          </div>
        )}

        {!caseLoading && !caseItem && open && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            未选择用例
          </div>
        )}

        {!caseLoading && caseItem && (
          <>
            <SheetHeader className="shrink-0 space-y-2 pr-8">
              <SheetTitle className="text-left text-lg leading-tight">
                {editing ? "编辑用例" : caseItem.title}
              </SheetTitle>
            </SheetHeader>

            {editing ? (
              <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                <CaseForm
                  mode="edit"
                  libraryId={libraryId}
                  directoryOptions={directoryOptions}
                  initialData={caseItem}
                  onSubmit={(payload) => {
                    updateCase.mutate(
                      { id: caseItem.id, ...payload },
                      {
                        onSuccess: () => {
                          onCaseUpdated?.();
                          setEditing(false);
                        }
                      }
                    );
                  }}
                  onCancel={() => setEditing(false)}
                  loading={updateCase.isPending}
                />
              </ScrollArea>
            ) : (
              <Tabs defaultValue="detail" className="flex-1 flex flex-col min-h-0">
                <TabsList className="shrink-0 w-full grid grid-cols-2">
                  <TabsTrigger value="detail">详情</TabsTrigger>
                  <TabsTrigger value="versions">版本历史</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="detail"
                  className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden"
                >
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setEditing(true)}
                        >
                          <PencilSimple className="h-4 w-4" weight="bold" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash className="h-4 w-4" weight="bold" />
                          删除
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={caseItem.priority} />
                        <Badge variant="secondary">
                          {caseTypeLabels[caseItem.caseType] ??
                            caseItem.caseType}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                          v{caseItem.latestVersionNo}
                        </Badge>
                      </div>

                      {caseItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {caseItem.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {caseItem.precondition && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            前置条件
                          </p>
                          <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                            {caseItem.precondition}
                          </p>
                        </div>
                      )}

                      {caseItem.contentType === "text" ? (
                        <>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              正文
                            </p>
                            <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
                              {caseItem.textContent ?? "—"}
                            </div>
                          </div>
                          {caseItem.textExpected && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                预期结果
                              </p>
                              <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
                                {caseItem.textExpected}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" />
                            步骤
                          </p>
                          <div className="space-y-2">
                            {caseItem.steps.map((step, i) => (
                              <div
                                key={i}
                                className="flex gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-medium text-primary">
                                  {step.stepOrder}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">
                                    {step.action}
                                  </p>
                                  {step.expected && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      预期：{step.expected}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        更新于{" "}
                        {caseItem.updatedAt
                          ? new Date(caseItem.updatedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent
                  value="versions"
                  className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden flex gap-4"
                >
                  <div className="w-48 shrink-0">
                    <CaseVersionHistory
                      caseId={caseId}
                      selectedVersionNo={selectedVersionNo}
                      onSelectVersion={setSelectedVersionNo}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CaseVersionDetail version={selectedVersion ?? null} />
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title="删除用例"
              description="确定删除该用例吗？删除后无法恢复。"
              confirmLabel="删除"
              variant="destructive"
              onConfirm={handleDeleteConfirm}
              loading={deleteCase.isPending}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
