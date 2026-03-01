import { useState, useMemo } from "react";
import { CaretDown, Plus, Tag as TagIcon, X } from "@phosphor-icons/react";
import { useTags, useCreateTag } from "../../api/tags";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";

interface TagMultiSelectProps {
  libraryId: number;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagMultiSelect({
  libraryId,
  value,
  onChange,
  placeholder = "选择或新建标签",
  className
}: TagMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const { data: tagsData, isLoading } = useTags(libraryId);
  const createTag = useCreateTag(libraryId);

  const existingNames = useMemo(
    () => (tagsData?.items ?? []).map((t) => t.name),
    [tagsData]
  );

  const filteredTags = useMemo(() => {
    const list = existingNames.filter(
      (name) => !search || name.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [existingNames, search]);

  const toggleTag = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((t) => t !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name || value.includes(name)) {
      setNewTagName("");
      return;
    }
    if (existingNames.includes(name)) {
      toggleTag(name);
      setNewTagName("");
      setOpen(false);
      return;
    }
    createTag.mutate(
      { name },
      {
        onSuccess: () => {
          onChange([...value, name]);
          setNewTagName("");
          setOpen(false);
        }
      }
    );
  };

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium leading-none">标签</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal h-auto min-h-10 py-2",
              value.length === 0 && "text-muted-foreground"
            )}
          >
            <span className="flex flex-wrap gap-1.5 truncate">
              {value.length === 0 ? (
                placeholder
              ) : (
                value.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="max-w-[120px] truncate text-xs font-normal"
                  >
                    {name}
                  </Badge>
                ))
              )}
            </span>
            <CaretDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2 border-b border-border/60">
            <Input
              placeholder="搜索标签…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {isLoading && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  加载中…
                </p>
              )}
              {!isLoading &&
                filteredTags.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      value.includes(name)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleTag(name)}
                  >
                    <TagIcon className="h-3.5 w-3.5 shrink-0" weight="duotone" />
                    {name}
                  </button>
                ))}
              {!isLoading && filteredTags.length === 0 && search && (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  无匹配标签，可在下方新建
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 p-2 border-t border-border/60">
            <Input
              placeholder="新标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 gap-1"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTag.isPending}
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              新建
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="gap-1 pr-1 py-0.5 group"
            >
              <span className="max-w-[140px] truncate">{name}</span>
              <button
                type="button"
                className="rounded p-0.5 opacity-70 hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-colors"
                onClick={() => removeTag(name)}
                aria-label={`移除标签 ${name}`}
              >
                <X className="h-3 w-3" weight="bold" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
