import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BookOpenText,
  ClipboardText,
  List,
  X,
  Flask,
  Key
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { readRuntimeConfig } from "../lib/runtime";
import { useCurrentProject } from "../hooks/use-current-project";
import { useLibraries } from "../api/libraries";
import { TokenModal } from "./token-modal";
import { ProjectSwitcher } from "./project-switcher";

export function LayoutShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);

  const { currentProjectId } = useCurrentProject();
  const libraries = useLibraries(currentProjectId ?? 0);

  // Auto-show token modal on first boot
  useEffect(() => {
    const runtime = readRuntimeConfig();
    const key = "testhub.last.boot";
    const previousBoot = window.localStorage.getItem(key);
    if (previousBoot !== runtime.bootId) {
      setTokenOpen(true);
      window.localStorage.setItem(key, runtime.bootId);
    }
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-border/70",
          "bg-[hsl(var(--sidebar-bg))]/90 backdrop-blur-md",
          "transition-transform duration-300 ease-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="px-5 pt-7 pb-6">
          <Link
            to="/"
            className="group flex items-center gap-2.5 no-underline"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Flask className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                TestHub
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                本地优先的测试管理
              </p>
            </div>
          </Link>
        </div>

        {/* Project Switcher */}
        <ProjectSwitcher />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
          {currentProjectId === null ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              请先选择一个项目
            </p>
          ) : (
            <>
              {/* Libraries */}
              <div className="space-y-1">
                <div className="flex items-center px-3 py-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpenText className="h-[18px] w-[18px]" />
                    用例库
                  </span>
                </div>
                {libraries.data?.items.length === 0 && (
                  <p className="px-3 py-1.5 text-xs text-muted-foreground/70">
                    暂无用例库
                  </p>
                )}
                {libraries.data?.items.map((lib) => {
                  const libPath = `/projects/${currentProjectId}/libraries/${lib.id}`;
                  const isActive = location.pathname.startsWith(libPath);
                  return (
                    <Link
                      key={lib.id}
                      to={libPath}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline",
                        "transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/15"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{lib.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Test Plans */}
              <div className="space-y-1">
                {(() => {
                  const plansPath = `/projects/${currentProjectId}/plans`;
                  const isActive = location.pathname.startsWith(plansPath);
                  return (
                    <Link
                      to={plansPath}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline",
                        "transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <ClipboardText
                        className="h-[18px] w-[18px] shrink-0"
                        weight={isActive ? "duotone" : "regular"}
                      />
                      测试计划
                    </Link>
                  );
                })()}
              </div>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-border/50 px-3 py-4">
          <button
            type="button"
            onClick={() => setTokenOpen(true)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
              "text-muted-foreground hover:bg-accent hover:text-foreground",
              "transition-all duration-200 cursor-pointer",
              "border-none bg-transparent"
            )}
          >
            <Key className="h-[18px] w-[18px] shrink-0" weight="regular" />
            API 令牌
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-border/70 bg-background/80 backdrop-blur-md px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-none bg-transparent text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="打开菜单"
          >
            <List className="h-5 w-5" weight="bold" />
          </button>
          <span className="ml-3 text-sm font-semibold tracking-tight text-foreground">
            TestHub
          </span>
        </div>

        {/* Close button on mobile sidebar */}
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 backdrop-blur-sm text-foreground border-none cursor-pointer lg:hidden"
            aria-label="关闭菜单"
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        )}

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      <TokenModal open={tokenOpen} onClose={() => setTokenOpen(false)} />
    </div>
  );
}
