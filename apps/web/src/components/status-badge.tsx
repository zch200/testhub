import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "待执行", className: "bg-gray-100 text-gray-700 border-gray-300" },
  passed: { label: "通过", className: "bg-green-100 text-green-700 border-green-300" },
  failed: { label: "失败", className: "bg-red-100 text-red-700 border-red-300" },
  blocked: { label: "阻塞", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  skipped: { label: "跳过", className: "bg-blue-100 text-blue-700 border-blue-300" }
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={cn(config.className, className)}>{config.label}</Badge>;
}
