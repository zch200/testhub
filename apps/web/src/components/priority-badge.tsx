import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const priorityConfig: Record<string, { label: string; className: string }> = {
  P0: { label: "P0", className: "bg-red-600 text-white border-red-600 hover:bg-red-600/80" },
  P1: { label: "P1", className: "bg-orange-500 text-white border-orange-500 hover:bg-orange-500/80" },
  P2: { label: "P2", className: "bg-blue-500 text-white border-blue-500 hover:bg-blue-500/80" },
  P3: { label: "P3", className: "bg-gray-400 text-white border-gray-400 hover:bg-gray-400/80" }
};

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? { label: priority, className: "" };
  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
