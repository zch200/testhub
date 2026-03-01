import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  PencilSimple,
  ListChecks,
  FolderOpen,
  Trash,
  FloppyDisk,
  ClockCounterClockwise
} from "@phosphor-icons/react";
import type { ExecutionStatus } from "@testhub/shared";
import {
  useBatchUpdatePlanCaseStatus,
  usePlanCaseHistory,
  usePlanCases,
  usePlanHistory,
  useUpdatePlanCase,
  useRemovePlanCase
} from "../../api/plan-cases";
import { usePlan, usePlanStats, useUpdatePlan } from "../../api/plans";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "../../components/ui/sheet";
import { PlanFormDialog } from "../../components/plan-form-dialog";
import { AddCasesDialog } from "../../components/add-cases-dialog";
import { AddByDirectoryDialog } from "../../components/add-by-directory-dialog";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { PlanStatusBadge } from "../../components/plan-status-badge";
import { PriorityBadge } from "../../components/priority-badge";
import { LoadingSpinner } from "../../components/loading-spinner";

const executionStatuses: ExecutionStatus[] = [
  "pending",
  "passed",
  "failed",
  "blocked",
  "skipped"
];

const executionStatusLabels: Record<ExecutionStatus, string> = {
  pending: "待执行",
  passed: "通过",
  failed: "失败",
  blocked: "阻塞",
  skipped: "跳过"
};

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

export function PlanDetailPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const planId = Number(params.planId);

  const plan = usePlan(planId);
  const stats = usePlanStats(planId);
  const planCases = usePlanCases(planId);
  const planHistory = usePlanHistory(planId);
  const updatePlanCase = useUpdatePlanCase(planId);
  const batchUpdate = useBatchUpdatePlanCaseStatus(planId);
  const removePlanCase = useRemovePlanCase(planId);
  const updatePlan = useUpdatePlan(projectId);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchStatus, setBatchStatus] = useState<ExecutionStatus>("pending");
  const [batchReasonNote, setBatchReasonNote] = useState("");
  const [historyPlanCaseId, setHistoryPlanCaseId] = useState<number | null>(
    null
  );
  const caseHistory = usePlanCaseHistory(planId, historyPlanCaseId);

  const [statusDraft, setStatusDraft] = useState<
    Record<number, ExecutionStatus>
  >({});
  const [remarkDraft, setRemarkDraft] = useState<Record<number, string>>({});
  const [reasonDraft, setReasonDraft] = useState<Record<number, string>>({});

  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [addCasesOpen, setAddCasesOpen] = useState(false);
  const [addByDirOpen, setAddByDirOpen] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null);
  const removeTargetItem = planCases.data?.items.find(
    (i) => i.id === removeTargetId
  );

  const progress = useMemo(() => {
    if (!stats.data || stats.data.total === 0) return 0;
    const done =
      stats.data.passed +
      stats.data.failed +
      stats.data.blocked +
      stats.data.skipped;
    return Math.round((done / stats.data.total) * 100);
  }, [stats.data]);

  const toggleSelected = (planCaseId: number) => {
    setSelectedIds((current) =>
      current.includes(planCaseId)
        ? current.filter((id) => id !== planCaseId)
        : [...current, planCaseId]
    );
  };

  const submitSingleUpdate = (planCaseId: number) => {
    const item = planCases.data?.items.find((entry) => entry.id === planCaseId);
    if (!item) return;
    updatePlanCase.mutate({
      planCaseId,
      executionStatus: statusDraft[planCaseId] ?? item.executionStatus,
      remark: remarkDraft[planCaseId] ?? item.remark ?? "",
      reasonNote: reasonDraft[planCaseId] || undefined
    });
    setReasonDraft((current) => ({ ...current, [planCaseId]: "" }));
  };

  const submitBatchUpdate = () => {
    if (selectedIds.length === 0) return;
    batchUpdate.mutate(
      {
        planCaseIds: selectedIds,
        executionStatus: batchStatus,
        reasonNote: batchReasonNote || undefined
      },
      {
        onSuccess: () => {
          setSelectedIds([]);
          setBatchReasonNote("");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {plan.data?.name ?? `计划 ${planId}`}
          </h2>
          <p className="text-muted-foreground mt-0.5">
            查看执行状态与完整状态变更记录。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/plans`} className="gap-2">
              <ArrowLeft className="h-4 w-4" weight="bold" />
              返回计划列表
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditPlanOpen(true)}
          >
            <PencilSimple className="h-4 w-4" />
            编辑计划
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setAddCasesOpen(true)}
          >
            <ListChecks className="h-4 w-4" />
            添加用例
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setAddByDirOpen(true)}
          >
            <FolderOpen className="h-4 w-4" />
            按目录添加
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">计划概览</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">状态</span>
              {plan.data?.status && (
                <PlanStatusBadge status={plan.data.status} />
              )}
            </div>
            <p className="text-muted-foreground">
              日期：{plan.data?.startDate ?? "—"} ~ {plan.data?.endDate ?? "—"}
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">进度</span>
                <strong>{progress}%</strong>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">统计</h3>
          {stats.isLoading && (
            <p className="text-sm text-muted-foreground">加载统计中…</p>
          )}
          {stats.data && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">总数</span>
                <span className="font-medium">{stats.data.total}</span>
              </li>
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">待执行</span>
                <span className="font-medium">{stats.data.pending}</span>
              </li>
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">通过</span>
                <span className="font-medium text-green-600">{stats.data.passed}</span>
              </li>
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">失败</span>
                <span className="font-medium text-red-600">{stats.data.failed}</span>
              </li>
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">阻塞</span>
                <span className="font-medium">{stats.data.blocked}</span>
              </li>
              <li className="flex justify-between rounded bg-muted/60 px-3 py-2">
                <span className="text-muted-foreground">跳过</span>
                <span className="font-medium">{stats.data.skipped}</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">批量更新</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={batchStatus}
            onValueChange={(v) => setBatchStatus(v as ExecutionStatus)}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {executionStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {executionStatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="原因说明（选填）"
            value={batchReasonNote}
            onChange={(e) => setBatchReasonNote(e.target.value)}
            className="h-9 w-48"
          />
          <Button
            size="sm"
            onClick={submitBatchUpdate}
            disabled={batchUpdate.isPending || selectedIds.length === 0}
          >
            {batchUpdate.isPending ? "更新中…" : `更新已选 (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-foreground">计划用例</h3>
        </div>
        {planCases.isLoading && (
          <LoadingSpinner label="加载计划用例中…" className="py-12" />
        )}
        {planCases.error && (
          <div className="p-4 text-destructive text-sm">
            {planCases.error.message}
          </div>
        )}
        {!planCases.isLoading && !planCases.error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pr-0">
                  <Checkbox
                    checked={
                      (planCases.data?.items.length ?? 0) > 0 &&
                      selectedIds.length === (planCases.data?.items.length ?? 0)
                    }
                    onCheckedChange={() => {
                      if (
                        selectedIds.length ===
                        (planCases.data?.items.length ?? 0)
                      ) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(
                          planCases.data?.items.map((i) => i.id) ?? []
                        );
                      }
                    }}
                  />
                </TableHead>
                <TableHead>标题</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="max-w-[140px]">备注</TableHead>
                <TableHead className="max-w-[120px]">原因说明</TableHead>
                <TableHead className="w-14">版本</TableHead>
                <TableHead className="w-[140px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planCases.data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-12"
                  >
                    该计划下暂无用例，可点击「添加用例」或「按目录添加」。
                  </TableCell>
                </TableRow>
              )}
              {planCases.data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-12 pr-0">
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelected(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.caseTitle}</span>
                      <span className="text-muted-foreground text-xs inline-flex items-center gap-1">
                        <PriorityBadge priority={item.casePriority} className="text-xs" />
                        {caseTypeLabels[item.caseType] ?? item.caseType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={statusDraft[item.id] ?? item.executionStatus}
                      onValueChange={(v) =>
                        setStatusDraft((c) => ({
                          ...c,
                          [item.id]: v as ExecutionStatus
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 border-dashed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {executionStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {executionStatusLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={remarkDraft[item.id] ?? item.remark ?? ""}
                      onChange={(e) =>
                        setRemarkDraft((c) => ({
                          ...c,
                          [item.id]: e.target.value
                        }))
                      }
                      className="h-8 text-sm"
                      placeholder="备注"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={reasonDraft[item.id] ?? ""}
                      onChange={(e) =>
                        setReasonDraft((c) => ({
                          ...c,
                          [item.id]: e.target.value
                        }))
                      }
                      className="h-8 text-sm"
                      placeholder="原因"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    v{item.caseVersionNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => submitSingleUpdate(item.id)}
                        disabled={updatePlanCase.isPending}
                      >
                        <FloppyDisk className="h-3.5 w-3.5" />
                        保存
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setHistoryPlanCaseId(item.id)}
                      >
                        <ClockCounterClockwise className="h-3.5 w-3.5" />
                        历史
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => setRemoveTargetId(item.id)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                        移除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">计划时间线</h3>
        {planHistory.isLoading && (
          <p className="text-sm text-muted-foreground">加载时间线中…</p>
        )}
        {planHistory.error && (
          <p className="text-sm text-destructive">{planHistory.error.message}</p>
        )}
        {planHistory.data && planHistory.data.items.length > 0 && (
          <ul className="space-y-2">
            {planHistory.data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm py-2 border-b border-border/60 last:border-0"
              >
                <strong className="text-foreground">{item.actor}</strong>
                <span className="text-muted-foreground">
                  {item.fromExecutionStatus ?? "—"} → {item.toExecutionStatus}{" "}
                  <span className="text-xs">({item.reasonType})</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  v{item.fromCaseVersionId ?? "-"} → v{item.toCaseVersionId ?? "-"}
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
        {planHistory.data && planHistory.data.items.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无记录</p>
        )}
      </div>

      <Sheet
        open={historyPlanCaseId !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryPlanCaseId(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>计划用例 #{historyPlanCaseId} 历史</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {caseHistory.isLoading && (
              <p className="text-sm text-muted-foreground">加载历史中…</p>
            )}
            {caseHistory.error && (
              <p className="text-sm text-destructive">
                {caseHistory.error.message}
              </p>
            )}
            {caseHistory.data && caseHistory.data.items.length > 0 && (
              <ul className="space-y-2">
                {caseHistory.data.items.map((item) => (
                  <li
                    key={item.id}
                    className="text-sm py-2 border-b border-border/60 last:border-0"
                  >
                    <span className="font-medium">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">
                      {item.fromExecutionStatus ?? "—"} → {item.toExecutionStatus}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {item.reasonType}
                    </span>
                    <br />
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                    {item.reasonNote && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.reasonNote}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {plan.data && (
        <PlanFormDialog
          open={editPlanOpen}
          onOpenChange={setEditPlanOpen}
          mode="edit"
          projectId={projectId}
          plan={plan.data}
          onSubmit={(values) => {
            updatePlan.mutate(
              { id: plan.data!.id, ...values },
              { onSuccess: () => setEditPlanOpen(false) }
            );
          }}
          loading={updatePlan.isPending}
          error={updatePlan.error?.message}
        />
      )}

      <AddCasesDialog
        open={addCasesOpen}
        onOpenChange={setAddCasesOpen}
        planId={planId}
        projectId={projectId}
      />

      <AddByDirectoryDialog
        open={addByDirOpen}
        onOpenChange={setAddByDirOpen}
        planId={planId}
        projectId={projectId}
      />

      <ConfirmDialog
        open={removeTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTargetId(null);
        }}
        title="从计划移除用例"
        description={
          removeTargetItem
            ? `确定将「${removeTargetItem.caseTitle}」从本计划中移除吗？执行记录将保留在时间线中。`
            : ""
        }
        confirmLabel="移除"
        onConfirm={() => {
          if (removeTargetId !== null) {
            removePlanCase.mutate(removeTargetId, {
              onSuccess: () => setRemoveTargetId(null)
            });
          }
        }}
        loading={removePlanCase.isPending}
      />
    </div>
  );
}
