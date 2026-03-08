import { useEffect, useRef, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  FileText,
  ListChecks,
  ChatText,
  ClockCounterClockwise
} from "@phosphor-icons/react";
import type { ExecutionStatus } from "@testhub/shared";
import { toast } from "sonner";
import { useCase } from "../api/cases";
import {
  useUpdatePlanCase,
  useAddPlanCaseRemark,
  usePlanCaseRemarks,
  usePlanCaseHistory,
  type PlanCaseListItem
} from "../api/plan-cases";
import { PriorityBadge } from "./priority-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "./ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

const executionStatusLabels: Record<ExecutionStatus, string> = {
  pending: "待执行",
  passed: "通过",
  failed: "失败",
  blocked: "阻塞",
  skipped: "跳过"
};

const allStatuses: ExecutionStatus[] = [
  "pending",
  "passed",
  "failed",
  "blocked",
  "skipped"
];

interface PlanCaseExecutionDrawerProps {
  planId: number;
  planCase: PlanCaseListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All plan-case items for prev/next navigation */
  items: PlanCaseListItem[];
  onNavigate: (planCase: PlanCaseListItem) => void;
}

export function PlanCaseExecutionDrawer({
  planId,
  planCase,
  open,
  onOpenChange,
  items,
  onNavigate
}: PlanCaseExecutionDrawerProps) {
  const [remarkText, setRemarkText] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useState<ExecutionStatus | null>(null);
  const autoNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: caseData, isLoading: caseLoading } = useCase(
    planCase?.caseId ?? null
  );
  const remarks = usePlanCaseRemarks(planId, planCase?.id ?? null);
  const history = usePlanCaseHistory(planId, planCase?.id ?? null);
  const updatePlanCase = useUpdatePlanCase(planId);
  const addRemark = useAddPlanCaseRemark(planId);

  const currentIndex = planCase
    ? items.findIndex((i) => i.id === planCase.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  // Clean up timer and reset optimistic status on unmount or when planCase changes
  useEffect(() => {
    setOptimisticStatus(null);
    return () => {
      if (autoNavTimerRef.current) {
        clearTimeout(autoNavTimerRef.current);
        autoNavTimerRef.current = null;
      }
    };
  }, [planCase?.id]);

  const goPrev = () => {
    if (hasPrev) onNavigate(items[currentIndex - 1]);
  };
  const goNext = () => {
    if (hasNext) onNavigate(items[currentIndex + 1]);
  };

  const displayStatus = optimisticStatus ?? planCase?.executionStatus ?? "pending";

  const handleStatusChange = (status: ExecutionStatus) => {
    if (!planCase || status === planCase.executionStatus) return;
    setOptimisticStatus(status);
    updatePlanCase.mutate(
      { planCaseId: planCase.id, executionStatus: status },
      {
        onSuccess: () => {
          if (hasNext) {
            toast.info("将自动进入下条用例", { duration: 1500 });
            if (autoNavTimerRef.current) {
              clearTimeout(autoNavTimerRef.current);
            }
            autoNavTimerRef.current = setTimeout(() => {
              autoNavTimerRef.current = null;
              onNavigate(items[currentIndex + 1]);
            }, 1500);
          } else {
            toast.success("状态已更新");
          }
        }
      }
    );
  };

  const handleAddRemark = () => {
    const content = remarkText.trim();
    if (!content || !planCase) return;
    addRemark.mutate(
      { planCaseId: planCase.id, content },
      { onSuccess: () => setRemarkText("") }
    );
  };

  const handleClose = (next: boolean) => {
    if (!next) setRemarkText("");
    onOpenChange(next);
  };

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

        {!caseLoading && !planCase && open && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            未选择用例
          </div>
        )}

        {!caseLoading && planCase && (
          <>
            {/* Header with navigation and status select */}
            <SheetHeader className="shrink-0 space-y-3 pr-8">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-left text-lg leading-tight flex-1 min-w-0 truncate">
                  {planCase.caseTitle}
                </SheetTitle>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasPrev}
                    onClick={goPrev}
                    title="上一条"
                  >
                    <CaretLeft className="h-4 w-4" weight="bold" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {currentIndex + 1}/{items.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasNext}
                    onClick={goNext}
                    title="下一条"
                  >
                    <CaretRight className="h-4 w-4" weight="bold" />
                  </Button>
                </div>
              </div>

              {/* Status dropdown */}
              <Select
                value={displayStatus}
                onValueChange={(v) => handleStatusChange(v as ExecutionStatus)}
                disabled={updatePlanCase.isPending}
              >
                <SelectTrigger className="w-[130px] h-8 border-dashed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {executionStatusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SheetHeader>

            <Tabs
              defaultValue="detail"
              className="flex-1 flex flex-col min-h-0 mt-1"
            >
              <TabsList className="shrink-0 w-full grid grid-cols-2">
                <TabsTrigger value="detail" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  用例 & 备注
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1">
                  <ClockCounterClockwise className="h-3.5 w-3.5" />
                  变更历史
                </TabsTrigger>
              </TabsList>

              {/* ── Detail & Remarks tab ── */}
              <TabsContent
                value="detail"
                className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden"
              >
                <ScrollArea className="h-full">
                  {caseData ? (
                    <CaseReadonlyContent caseData={caseData} />
                  ) : (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      用例数据不可用
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Remarks section */}
                  <div className="pr-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ChatText className="h-3.5 w-3.5" />
                      备注
                    </p>
                    <div className="space-y-2 mb-3">
                      <Textarea
                        placeholder="添加备注…"
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddRemark}
                        disabled={
                          addRemark.isPending || remarkText.trim().length === 0
                        }
                      >
                        {addRemark.isPending ? "提交中…" : "添加备注"}
                      </Button>
                    </div>
                    {remarks.isLoading && (
                      <p className="text-sm text-muted-foreground py-4">
                        加载备注中…
                      </p>
                    )}
                    {remarks.data && remarks.data.items.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4">
                        暂无备注
                      </p>
                    )}
                    {remarks.data && remarks.data.items.length > 0 && (
                      <ul className="space-y-3">
                        {remarks.data.items.map((r) => (
                          <li
                            key={r.id}
                            className="rounded-md border border-border/60 bg-muted/20 p-3"
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {r.content}
                            </p>
                            <time className="text-xs text-muted-foreground mt-1 block">
                              {new Date(r.createdAt).toLocaleString()}
                            </time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ── History tab ── */}
              <TabsContent
                value="history"
                className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden"
              >
                <ScrollArea className="h-full">
                  {history.isLoading && (
                    <p className="text-sm text-muted-foreground py-4">
                      加载历史中…
                    </p>
                  )}
                  {history.data && history.data.items.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">
                      暂无变更记录
                    </p>
                  )}
                  {history.data && history.data.items.length > 0 && (
                    <ul className="space-y-2 pr-4">
                      {history.data.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm py-2 border-b border-border/60 last:border-0"
                        >
                          <strong className="text-foreground">
                            {item.actor}
                          </strong>
                          <span className="text-muted-foreground">
                            {item.fromExecutionStatus ?? "—"} →{" "}
                            {item.toExecutionStatus}{" "}
                            <span className="text-xs">
                              ({item.reasonType})
                            </span>
                          </span>
                          <time className="text-muted-foreground text-xs ml-auto">
                            {new Date(item.createdAt).toLocaleString()}
                          </time>
                          {item.reasonNote && (
                            <span className="w-full text-muted-foreground text-xs mt-0.5">
                              {item.reasonNote}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Readonly case content (extracted for clarity) ── */

interface CaseReadonlyContentProps {
  caseData: {
    title: string;
    priority: string;
    caseType: string;
    latestVersionNo: number;
    tags: string[];
    precondition: string | null;
    contentType: "text" | "step";
    textContent: string | null;
    textExpected: string | null;
    steps: Array<{ stepOrder: number; action: string; expected?: string | null }>;
    updatedAt: string | null;
  };
}

function CaseReadonlyContent({ caseData }: CaseReadonlyContentProps) {
  return (
    <div className="space-y-4 pr-4">
      <div className="flex flex-wrap gap-2">
        <PriorityBadge priority={caseData.priority} />
        <Badge variant="secondary">
          {caseTypeLabels[caseData.caseType] ?? caseData.caseType}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          v{caseData.latestVersionNo}
        </Badge>
      </div>

      {caseData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {caseData.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {caseData.precondition && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            前置条件
          </p>
          <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3">
            {caseData.precondition}
          </p>
        </div>
      )}

      {caseData.contentType === "text" ? (
        <>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              正文
            </p>
            <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
              {caseData.textContent ?? "—"}
            </div>
          </div>
          {caseData.textExpected && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                预期结果
              </p>
              <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
                {caseData.textExpected}
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
            {caseData.steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-medium text-primary">
                  {step.stepOrder}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.action}</p>
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
        {caseData.updatedAt
          ? new Date(caseData.updatedAt).toLocaleString()
          : "—"}
      </p>
    </div>
  );
}
