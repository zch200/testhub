import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@testhub/shared";
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

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectInput) =>
      apiRequest<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProjectInput & { id: number }) =>
      apiRequest<Project>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}
