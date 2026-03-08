import { useMemo, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { readRuntimeConfig } from "../lib/runtime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";

interface TokenModalProps {
  open: boolean;
  onClose: () => void;
}

export function TokenModal({ open, onClose }: TokenModalProps) {
  const runtime = useMemo(() => readRuntimeConfig(), []);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(runtime.apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 令牌已就绪</DialogTitle>
          <DialogDescription>
            可在脚本或编程助手中使用此令牌调用 API。
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm break-all select-all">
          {runtime.apiToken || <span className="text-muted-foreground italic">（开发模式无令牌）</span>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCopy}
            disabled={!runtime.apiToken}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" weight="bold" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制令牌
              </>
            )}
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
