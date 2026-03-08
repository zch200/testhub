import { Link, useParams } from "react-router-dom";
import { usePlans } from "../../api/plans";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import { PlanStatusBadge } from "../../components/plan-status-badge";
import { LoadingSpinner } from "../../components/loading-spinner";

export function PlansPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  const plans = usePlans(projectId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">测试计划</h2>
        <p className="text-muted-foreground">
          查看测试计划与执行状态。
        </p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    暂无测试计划，请通过 API 创建。
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
