import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Briefcase,
  List,
  X,
  Flask,
  Key
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { readRuntimeConfig } from "../lib/runtime";
import { TokenModal } from "./token-modal";

const navItems = [
  { to: "/projects", label: "项目", icon: Briefcase }
];

export function LayoutShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);

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
            to="/projects"
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

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline",
                  "transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  weight={isActive ? "duotone" : "regular"}
                />
                {item.label}
              </Link>
            );
          })}
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
