import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const planStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-700 border-gray-300" },
  in_progress: { label: "进行中", className: "bg-blue-100 text-blue-700 border-blue-300" },
  completed: { label: "已完成", className: "bg-green-100 text-green-700 border-green-300" },
  archived: { label: "已归档", className: "bg-orange-100 text-orange-700 border-orange-300" }
};

interface PlanStatusBadgeProps {
  status: string;
  className?: string;
}

export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = planStatusConfig[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={cn(config.className, className)}>{config.label}</Badge>;
}
