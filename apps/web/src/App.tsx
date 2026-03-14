import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutShell } from "./components/layout-shell";
import { ProjectProvider } from "./contexts/project-context";
import { LibraryCasesPage } from "./pages/libraries/library-cases-page";
import { PlanDetailPage } from "./pages/plans/plan-detail-page";
import { PlansPage } from "./pages/plans/plans-page";
import { EmptyStatePage } from "./pages/empty-state-page";
import { useProjects } from "./api/projects";

function RootRedirect() {
  const { data, isLoading } = useProjects();

  if (isLoading) {
    return null; // 或显示加载状态
  }

  // 有项目时跳转到第一个项目的测试计划页
  if (data && data.items.length > 0) {
    return <Navigate to={`/projects/${data.items[0].id}/plans`} replace />;
  }

  // 无项目时显示引导页
  return <EmptyStatePage />;
}

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<LayoutShell />}>
          <Route path="/projects/:projectId/libraries/:libraryId" element={<LibraryCasesPage />} />
          <Route path="/projects/:projectId/plans" element={<PlansPage />} />
          <Route path="/projects/:projectId/plans/:planId" element={<PlanDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProjectProvider>
  );
}
