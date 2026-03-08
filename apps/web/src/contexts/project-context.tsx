import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { Project } from "@testhub/shared";
import { useProjects } from "../api/projects";

const STORAGE_KEY = "testhub.currentProjectId";

export interface ProjectContextValue {
  currentProjectId: number | null;
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  switchProject: (id: number) => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

function readStoredProjectId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useProjects();
  const projects = data?.items ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(readStoredProjectId);

  const switchProject = useCallback((id: number) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  // 当项目列表加载完成后，校验 selectedId 的有效性
  useEffect(() => {
    if (isLoading || projects.length === 0) {
      // 无项目时清空选择
      if (!isLoading && projects.length === 0 && selectedId !== null) {
        setSelectedId(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    const isValid = projects.some((p) => p.id === selectedId);
    if (!isValid) {
      // localStorage 中的值无效或未设置，自动选中第一个
      const firstId = projects[0].id;
      setSelectedId(firstId);
      localStorage.setItem(STORAGE_KEY, String(firstId));
    }
  }, [isLoading, projects, selectedId]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId]
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      currentProjectId: selectedId,
      currentProject,
      projects,
      isLoading,
      switchProject,
    }),
    [selectedId, currentProject, projects, isLoading, switchProject]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
      <ProjectUrlSync />
    </ProjectContext.Provider>
  );
}

/**
 * 独立组件：从 URL 中解析 projectId 并同步到 Context。
 * 放在 Provider 内部但作为独立组件，避免 useLocation 导致整棵树重渲染。
 */
const PROJECT_PATH_RE = /^\/projects\/(\d+)\//;

function ProjectUrlSync() {
  const location = useLocation();
  const ctx = useContext(ProjectContext);

  useEffect(() => {
    if (!ctx || ctx.isLoading) return;
    const match = PROJECT_PATH_RE.exec(location.pathname);
    if (!match) return;
    const urlProjectId = Number(match[1]);
    if (urlProjectId !== ctx.currentProjectId && ctx.projects.some((p) => p.id === urlProjectId)) {
      ctx.switchProject(urlProjectId);
    }
  }, [location.pathname, ctx]);

  return null;
}
