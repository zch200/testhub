import { useQuery } from "@tanstack/react-query";
import type { Project } from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiRequest<Paginated<Project>>("/projects", { query: { page: 1, pageSize: 100 } })
  });
}

export function useProject(projectId: number) {
  return useQuery({
    enabled: Number.isFinite(projectId),
    queryKey: ["project", projectId],
    queryFn: () => apiRequest<Project>(`/projects/${projectId}`)
  });
}
