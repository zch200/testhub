import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretUpDown, Check, Info } from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { useCurrentProject } from "../hooks/use-current-project";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function ProjectSwitcher() {
  const { currentProject, projects, isLoading, switchProject } = useCurrentProject();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="h-9 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground bg-muted/30">
          <Info className="h-4 w-4 shrink-0" />
          <span>请通过 API 创建项目</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
              "bg-muted/50 hover:bg-muted transition-colors cursor-pointer",
              "border border-border/50 text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <span className="truncate">{currentProject?.name ?? "选择项目"}</span>
            <CaretUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[228px] p-1" align="start" sideOffset={6}>
          <div className="max-h-[240px] overflow-y-auto">
            {projects.map((project) => {
              const isSelected = project.id === currentProject?.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    switchProject(project.id);
                    setOpen(false);
                    // 切换项目后跳转到新项目的测试计划页
                    navigate(`/projects/${project.id}/plans`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer",
                    "border-none bg-transparent text-left",
                    "transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  <Check
                    className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                    weight="bold"
                  />
                  <span className="truncate">{project.name}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
