import { Play, CheckCircle, Archive } from "@phosphor-icons/react";
import type { Plan } from "@testhub/shared";
import { useUpdatePlan } from "../api/plans";
import { Button } from "./ui/button";

type PlanStatus = Plan["status"];

const transitions: Record<string, { next: PlanStatus; label: string; icon: typeof Play }> = {
  draft: { next: "in_progress", label: "开始执行", icon: Play },
  in_progress: { next: "completed", label: "完成计划", icon: CheckCircle },
  completed: { next: "archived", label: "归档", icon: Archive }
};

interface PlanStatusControlProps {
  plan: Plan;
  projectId: number;
}

export function PlanStatusControl({ plan, projectId }: PlanStatusControlProps) {
  const updatePlan = useUpdatePlan(projectId);
  const transition = transitions[plan.status];

  if (!transition) return null;

  const Icon = transition.icon;

  return (
    <Button
      variant="default"
      size="sm"
      className="gap-2"
      onClick={() => {
        updatePlan.mutate({ id: plan.id, status: transition.next });
      }}
      disabled={updatePlan.isPending}
    >
      <Icon className="h-4 w-4" weight="bold" />
      {updatePlan.isPending ? "处理中…" : transition.label}
    </Button>
  );
}
