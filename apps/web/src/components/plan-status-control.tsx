import { useState } from "react";
import { Play, CheckCircle, Archive, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { Plan } from "@testhub/shared";
import { useUpdatePlan } from "../api/plans";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./confirm-dialog";

type PlanStatus = Plan["status"];

interface Transition {
  next: PlanStatus;
  label: string;
  icon: typeof Play;
  variant: "default" | "outline";
  confirmTitle: string;
  confirmDesc: string;
}

const forwardTransitions: Record<string, Transition> = {
  draft: {
    next: "in_progress",
    label: "开始执行",
    icon: Play,
    variant: "default",
    confirmTitle: "开始执行计划",
    confirmDesc: "确定要将计划状态从「草稿」变更为「进行中」吗？"
  },
  in_progress: {
    next: "completed",
    label: "完成计划",
    icon: CheckCircle,
    variant: "default",
    confirmTitle: "完成计划",
    confirmDesc: "确定要将计划状态从「进行中」变更为「已完成」吗？"
  },
  completed: {
    next: "archived",
    label: "归档",
    icon: Archive,
    variant: "default",
    confirmTitle: "归档计划",
    confirmDesc: "确定要将计划归档吗？归档后无法回退。"
  }
};

const backwardTransitions: Record<string, Transition> = {
  in_progress: {
    next: "draft",
    label: "回到草稿",
    icon: ArrowCounterClockwise,
    variant: "outline",
    confirmTitle: "回退到草稿",
    confirmDesc: "确定要将计划状态从「进行中」回退为「草稿」吗？"
  },
  completed: {
    next: "in_progress",
    label: "重新执行",
    icon: ArrowCounterClockwise,
    variant: "outline",
    confirmTitle: "重新执行",
    confirmDesc: "确定要将计划状态从「已完成」回退为「进行中」吗？"
  }
};

interface PlanStatusControlProps {
  plan: Plan;
  projectId: number;
}

export function PlanStatusControl({ plan, projectId }: PlanStatusControlProps) {
  const updatePlan = useUpdatePlan(projectId);
  const [pendingTransition, setPendingTransition] = useState<Transition | null>(null);

  const forward = forwardTransitions[plan.status];
  const backward = backwardTransitions[plan.status];

  const handleConfirm = () => {
    if (!pendingTransition) return;
    updatePlan.mutate(
      { id: plan.id, status: pendingTransition.next },
      { onSettled: () => setPendingTransition(null) }
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {backward && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPendingTransition(backward)}
            disabled={updatePlan.isPending}
          >
            <backward.icon className="h-4 w-4" weight="bold" />
            {backward.label}
          </Button>
        )}
        {forward && (
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => setPendingTransition(forward)}
            disabled={updatePlan.isPending}
          >
            <forward.icon className="h-4 w-4" weight="bold" />
            {forward.label}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={pendingTransition !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null);
        }}
        title={pendingTransition?.confirmTitle ?? ""}
        description={pendingTransition?.confirmDesc ?? ""}
        confirmLabel="确定"
        variant="default"
        onConfirm={handleConfirm}
        loading={updatePlan.isPending}
      />
    </>
  );
}
