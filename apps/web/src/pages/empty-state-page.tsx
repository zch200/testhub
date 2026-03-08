import { useState } from "react";
import { Key, Copy, Check, Terminal, Rocket } from "@phosphor-icons/react";
import { readRuntimeConfig } from "../lib/runtime";
import { Button } from "../components/ui/button";

export function EmptyStatePage() {
  const [copied, setCopied] = useState(false);
  const runtime = readRuntimeConfig();

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(runtime.apiToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = runtime.apiToken;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const curlExample = `curl -X POST ${runtime.apiBase}/projects \\
  -H "Content-Type: application/json" \\
  -H "x-testhub-token: ${runtime.apiToken}" \\
  -d '{"name": "我的项目", "description": "项目描述"}'`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Rocket className="h-8 w-8" weight="duotone" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">欢迎使用 TestHub</h1>
          <p className="text-muted-foreground">
            TestHub 是一个本地优先的测试管理工具。项目、用例库、用例和测试计划通过 API 创建，您在此执行测试并标记结果。
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-left space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            通过 API 创建第一个项目
          </div>

          <div className="rounded-md bg-muted p-4 font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap break-all">{curlExample}</pre>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="h-4 w-4" />
              <span>API Token</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToken}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制 Token
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          创建项目后刷新页面即可开始使用。查看{" "}
          <a
            href={`${runtime.apiBase.replace("/api/v1", "")}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            API 文档
          </a>{" "}
          了解更多接口。
        </p>
      </div>
    </div>
  );
}
