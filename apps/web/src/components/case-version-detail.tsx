import type { CaseVersion } from "../api/cases";
import { PriorityBadge } from "./priority-badge";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

interface CaseVersionDetailProps {
  version: CaseVersion | null;
  className?: string;
}

export function CaseVersionDetail({ version, className }: CaseVersionDetailProps) {
  if (!version) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12 text-sm text-muted-foreground",
          className
        )}
      >
        选择版本查看
      </div>
    );
  }

  const isText = version.contentType === "text";

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-5 pr-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              v{version.versionNo}
            </span>
            <PriorityBadge priority={version.priority} />
            <Badge variant="secondary" className="text-xs">
              {caseTypeLabels[version.caseType] ?? version.caseType}
            </Badge>
          </div>
          <h3 className="text-base font-semibold leading-tight tracking-tight">
            {version.title}
          </h3>
        </div>

        {version.precondition && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                前置条件
              </p>
              <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                {version.precondition}
              </p>
            </div>
          </>
        )}

        {isText ? (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                正文
              </p>
              <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
                {version.textContent ?? "—"}
              </div>
            </div>
            {version.textExpected && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  预期结果
                </p>
                <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 font-mono">
                  {version.textExpected}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                步骤
              </p>
              <div className="space-y-2">
                {version.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-medium text-primary">
                      {step.stepOrder}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium">{step.action}</p>
                      {step.expected && (
                        <p className="text-xs text-muted-foreground">
                          预期：{step.expected}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {version.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                标签
              </p>
              <div className="flex flex-wrap gap-1.5">
                {version.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          创建于 {version.createdAt ? new Date(version.createdAt).toLocaleString() : "—"}
        </p>
      </div>
    </ScrollArea>
  );
}
