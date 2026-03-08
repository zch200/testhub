import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExecutionStatus, PlanCaseRemark, PlanCaseStatusHistory } from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

export interface PlanCaseListItem {
  id: number;
  planId: number;
  caseId: number;
  caseVersionId: number;
  caseVersionNo: number;
  caseTitle: string;
  casePriority: string;
  caseType: string;
  executionStatus: ExecutionStatus;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function usePlanCases(planId: number, status?: ExecutionStatus) {
  return useQuery({
    enabled: Number.isFinite(planId),
    queryKey: ["plan-cases", planId, status],
    queryFn: () =>
      apiRequest<Paginated<PlanCaseListItem>>(`/plans/${planId}/cases`, {
        query: {
          page: 1,
          pageSize: 100,
          sortBy: "updatedAt",
          sortOrder: "desc",
          status
        }
      })
  });
}

export function useUpdatePlanCase(planId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      planCaseId: number;
      executionStatus?: ExecutionStatus;
    }) =>
      apiRequest<PlanCaseListItem>(`/plans/${planId}/cases/${payload.planCaseId}`, {
        method: "PUT",
        body: JSON.stringify({
          executionStatus: payload.executionStatus
        })
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-cases", planId] });
      void queryClient.invalidateQueries({ queryKey: ["plan-stats", planId] });
      void queryClient.invalidateQueries({ queryKey: ["plan-history", planId] });
    }
  });
}

export function useBatchUpdatePlanCaseStatus(planId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      planCaseIds: number[];
      executionStatus: ExecutionStatus;
    }) =>
      apiRequest<void>(`/plans/${planId}/cases/batch-status`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-cases", planId] });
      void queryClient.invalidateQueries({ queryKey: ["plan-stats", planId] });
      void queryClient.invalidateQueries({ queryKey: ["plan-history", planId] });
    }
  });
}

export function useAddPlanCaseRemark(planId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { planCaseId: number; content: string }) =>
      apiRequest<PlanCaseRemark>(`/plans/${planId}/cases/${payload.planCaseId}/remarks`, {
        method: "POST",
        body: JSON.stringify({ content: payload.content })
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-case-remarks", planId, variables.planCaseId]
      });
    }
  });
}

export function usePlanCaseRemarks(planId: number, planCaseId: number | null) {
  return useQuery({
    enabled: Number.isFinite(planId) && planCaseId !== null,
    queryKey: ["plan-case-remarks", planId, planCaseId],
    queryFn: () =>
      apiRequest<Paginated<PlanCaseRemark>>(`/plans/${planId}/cases/${planCaseId}/remarks`, {
        query: { page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" }
      })
  });
}

export function usePlanCaseHistory(planId: number, planCaseId: number | null) {
  return useQuery({
    enabled: Number.isFinite(planId) && planCaseId !== null,
    queryKey: ["plan-case-history", planId, planCaseId],
    queryFn: () =>
      apiRequest<Paginated<PlanCaseStatusHistory>>(`/plans/${planId}/cases/${planCaseId}/history`, {
        query: { page: 1, pageSize: 100, sortBy: "createdAt", sortOrder: "desc" }
      })
  });
}

export function usePlanHistory(planId: number) {
  return useQuery({
    enabled: Number.isFinite(planId),
    queryKey: ["plan-history", planId],
    queryFn: () =>
      apiRequest<Paginated<PlanCaseStatusHistory>>(`/plans/${planId}/history`, {
        query: {
          page: 1,
          pageSize: 100,
          sortBy: "createdAt",
          sortOrder: "desc"
        }
      })
  });
}
