import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, PencilSimple, Trash, ArrowLeft } from "@phosphor-icons/react";
import type { CreatePlanInput, Plan, UpdatePlanInput } from "@testhub/shared";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan
} from "../../api/plans";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import { PlanFormDialog } from "../../components/plan-form-dialog";
import { PlanStatusBadge } from "../../components/plan-status-badge";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { LoadingSpinner } from "../../components/loading-spinner";

export function PlansPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const plans = usePlans(projectId);
  const createPlan = useCreatePlan(projectId);
  const updatePlan = useUpdatePlan(projectId);
  const deletePlan = useDeletePlan(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">测试计划</h2>
          <p className="text-muted-foreground">
            管理测试计划与执行状态。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" weight="bold" />
              返回项目
            </Link>
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" weight="bold" />
            新建计划
          </Button>
        </div>
      </div>

      {plans.isLoading && (
        <LoadingSpinner label="加载计划中…" className="py-12" />
      )}
      {plans.error && (
        <p className="text-destructive">{plans.error.message}</p>
      )}

      {!plans.isLoading && !plans.error && plans.data && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开始日期</TableHead>
                <TableHead>结束日期</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12"
                  >
                    暂无测试计划，请先创建一个。
                  </TableCell>
                </TableRow>
              )}
              {plans.data.items.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/projects/${projectId}/plans/${plan.id}`}
                      className="text-primary hover:underline"
                    >
                      {plan.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PlanStatusBadge status={plan.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.startDate ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.endDate ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(plan.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditPlan(plan)}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(plan)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PlanFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        projectId={projectId}
        onSubmit={(values) => {
          createPlan.mutate(values as CreatePlanInput, {
            onSuccess: () => setCreateOpen(false)
          });
        }}
        loading={createPlan.isPending}
        error={createPlan.error?.message}
      />

      {editPlan && (
        <PlanFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditPlan(null);
          }}
          mode="edit"
          projectId={projectId}
          plan={editPlan}
          onSubmit={(values) => {
            const payload: UpdatePlanInput = {};
            if ("name" in values && values.name !== undefined) payload.name = values.name;
            if ("description" in values) payload.description = values.description;
            if ("startDate" in values) payload.startDate = values.startDate;
            if ("endDate" in values) payload.endDate = values.endDate;
            if ("status" in values && values.status !== undefined) payload.status = values.status;
            updatePlan.mutate(
              { id: editPlan.id, ...payload },
              { onSuccess: () => setEditPlan(null) }
            );
          }}
          loading={updatePlan.isPending}
          error={updatePlan.error?.message}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="删除计划"
        description={
          deleteTarget
            ? `确定要删除「${deleteTarget.name}」吗？将同时删除该计划下的所有执行记录，且无法恢复。`
            : ""
        }
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteTarget) {
            deletePlan.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null)
            });
          }
        }}
        loading={deletePlan.isPending}
      />
    </div>
  );
}
