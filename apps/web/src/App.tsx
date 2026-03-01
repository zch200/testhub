import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutShell } from "./components/layout-shell";
import { LibraryCasesPage } from "./pages/libraries/library-cases-page";
import { PlanDetailPage } from "./pages/plans/plan-detail-page";
import { PlansPage } from "./pages/plans/plans-page";
import { ProjectDetailPage } from "./pages/projects/project-detail-page";
import { ProjectsPage } from "./pages/projects/projects-page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route element={<LayoutShell />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/libraries/:libraryId" element={<LibraryCasesPage />} />
        <Route path="/projects/:projectId/plans" element={<PlansPage />} />
        <Route path="/projects/:projectId/plans/:planId" element={<PlanDetailPage />} />
      </Route>
    </Routes>
  );
}
