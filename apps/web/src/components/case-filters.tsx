import { useCallback, useState, useEffect, useRef } from "react";
import { Funnel, X } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { useTags } from "../api/tags";
import { cn } from "../lib/utils";

export interface CaseFiltersValue {
  priority?: "P0" | "P1" | "P2" | "P3" | "";
  type?: "functional" | "performance" | "api" | "ui" | "other" | "";
  tag?: string;
  keyword?: string;
}

const priorityOptions = ["P0", "P1", "P2", "P3"] as const;
const caseTypeOptions = [
  { value: "functional", label: "功能" },
  { value: "performance", label: "性能" },
  { value: "api", label: "接口" },
  { value: "ui", label: "UI" },
  { value: "other", label: "其他" }
] as const;

const DEBOUNCE_MS = 300;

interface CaseFiltersProps {
  libraryId: number;
  value: CaseFiltersValue;
  onChange: (value: CaseFiltersValue) => void;
  className?: string;
}

export function CaseFilters({
  libraryId,
  value,
  onChange,
  className
}: CaseFiltersProps) {
  const [keywordInput, setKeywordInput] = useState(value.keyword ?? "");
  const valueRef = useRef(value);
  valueRef.current = value;
  const { data: tagsData } = useTags(libraryId);
  const tags = tagsData?.items ?? [];

  useEffect(() => {
    setKeywordInput(value.keyword ?? "");
  }, [value.keyword]);

  useEffect(() => {
    const t = setTimeout(() => {
      onChange({
        ...valueRef.current,
        keyword: keywordInput.trim() || undefined
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [keywordInput, onChange]);

  const hasActiveFilters =
    value.priority ||
    value.type ||
    value.tag ||
    (value.keyword && value.keyword.length > 0);

  const clearFilters = useCallback(() => {
    setKeywordInput("");
    onChange({
      priority: undefined,
      type: undefined,
      tag: undefined,
      keyword: undefined
    });
  }, [onChange]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-2.5",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        <Funnel className="h-4 w-4" weight="duotone" />
        <span className="text-sm font-medium">筛选</span>
      </div>

      <Select
        value={value.priority ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...value,
            priority: v === "all" ? undefined : (v as "P0" | "P1" | "P2" | "P3")
          })
        }
      >
        <SelectTrigger className="w-[90px] h-8 text-sm">
          <SelectValue placeholder="优先级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {priorityOptions.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.type ?? "all"}
        onValueChange={(v) =>
          onChange({
            ...value,
            type:
              v === "all"
                ? undefined
                : (v as "functional" | "performance" | "api" | "ui" | "other")
          })
        }
      >
        <SelectTrigger className="w-[100px] h-8 text-sm">
          <SelectValue placeholder="类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {caseTypeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.tag ?? "all"}
        onValueChange={(v) =>
          onChange({ ...value, tag: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[110px] h-8 text-sm">
          <SelectValue placeholder="标签" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.name}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="关键词搜索…"
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
        className="h-8 w-48 text-sm"
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" weight="bold" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
