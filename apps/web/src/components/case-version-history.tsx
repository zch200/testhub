import { useCaseVersions, type CaseVersion } from "../api/cases";
import { PriorityBadge } from "./priority-badge";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

const caseTypeLabels: Record<string, string> = {
  functional: "功能",
  performance: "性能",
  api: "接口",
  ui: "UI",
  other: "其他"
};

interface CaseVersionHistoryProps {
  caseId: number | null;
  selectedVersionNo: number | null;
  onSelectVersion: (versionNo: number) => void;
  className?: string;
}

export function CaseVersionHistory({
  caseId,
  selectedVersionNo,
  onSelectVersion,
  className
}: CaseVersionHistoryProps) {
  const { data, isLoading, error } = useCaseVersions(caseId);
  const versions = data?.items ?? [];

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-8 text-sm text-muted-foreground",
          className
        )}
      >
        加载版本列表中…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-8 text-sm text-destructive",
          className
        )}
      >
        {error.message}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-8 text-sm text-muted-foreground",
          className
        )}
      >
        暂无历史版本
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <ul className="space-y-1 pr-2">
        {versions.map((v) => (
          <VersionItem
            key={v.id}
            version={v}
            isSelected={selectedVersionNo === v.versionNo}
            onSelect={() => onSelectVersion(v.versionNo)}
          />
        ))}
      </ul>
    </ScrollArea>
  );
}

function VersionItem({
  version,
  isSelected,
  onSelect
}: {
  version: CaseVersion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200",
          "hover:bg-accent/70 hover:border-primary/20",
          isSelected
            ? "border-primary/40 bg-primary/10 ring-1 ring-primary/20"
            : "border-border/60 bg-card/50"
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-primary">
            v{version.versionNo}
          </span>
          <PriorityBadge priority={version.priority} />
          <span className="text-xs text-muted-foreground">
            {caseTypeLabels[version.caseType] ?? version.caseType}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium truncate">{version.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {version.createdAt
            ? new Date(version.createdAt).toLocaleString()
            : ""}
        </p>
      </button>
    </li>
  );
}
