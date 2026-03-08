import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

export function usePlans(projectId: number) {
  return useQuery({
    enabled: Number.isFinite(projectId),
    queryKey: ["plans", projectId],
    queryFn: () =>
      apiRequest<Paginated<Plan>>(`/projects/${projectId}/plans`, {
        query: { page: 1, pageSize: 100, sortBy: "updatedAt", sortOrder: "desc" }
      })
  });
}

export function usePlan(planId: number) {
  return useQuery({
    enabled: Number.isFinite(planId),
    queryKey: ["plan", planId],
    queryFn: () => apiRequest<Plan>(`/plans/${planId}`)
  });
}

export function usePlanStats(planId: number) {
  return useQuery({
    enabled: Number.isFinite(planId),
    queryKey: ["plan-stats", planId],
    queryFn: () =>
      apiRequest<{
        total: number;
        pending: number;
        passed: number;
        failed: number;
        blocked: number;
        skipped: number;
      }>(`/plans/${planId}/stats`)
  });
}

export function useUpdatePlan(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      status?: "draft" | "in_progress" | "completed" | "archived";
    }) =>
      apiRequest<Plan>(`/plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["plan", variables.id] });
    }
  });
}
