import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BatchCreateCaseInput,
  Case,
  CreateCaseInput,
  UpdateCaseInput
} from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

/** 用例列表筛选/分页参数（与 caseListQuerySchema 对齐） */
export interface CasesListParams {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "title" | "priority";
  sortOrder?: "asc" | "desc";
  directoryId?: number | null;
  priority?: "P0" | "P1" | "P2" | "P3";
  type?: "functional" | "performance" | "api" | "ui" | "other";
  tag?: string;
  keyword?: string;
}

const defaultParams: Required<Omit<CasesListParams, "directoryId" | "priority" | "type" | "tag" | "keyword">> & {
  directoryId?: number | null;
  priority?: string;
  type?: string;
  tag?: string;
  keyword?: string;
} = {
  page: 1,
  pageSize: 100,
  sortBy: "updatedAt",
  sortOrder: "desc"
};

export function useCases(libraryId: number, params: CasesListParams = {}) {
  const query = { ...defaultParams, ...params };
  const queryObj: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  };
  if (query.directoryId != null && query.directoryId > 0) {
    queryObj.directoryId = query.directoryId;
  }
  if (query.priority) queryObj.priority = query.priority;
  if (query.type) queryObj.type = query.type;
  if (query.tag) queryObj.tag = query.tag;
  if (query.keyword) queryObj.keyword = query.keyword;

  return useQuery({
    enabled: Number.isFinite(libraryId),
    queryKey: ["cases", libraryId, queryObj],
    queryFn: () =>
      apiRequest<Paginated<Case>>(`/libraries/${libraryId}/cases`, {
        query: queryObj
      })
  });
}

export function useCase(id: number | null) {
  return useQuery({
    enabled: id != null && Number.isFinite(id),
    queryKey: ["case", id],
    queryFn: () => apiRequest<Case>(`/cases/${id}`)
  });
}

export function useCreateCase(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCaseInput) =>
      apiRequest<Case>(`/libraries/${libraryId}/cases`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", libraryId] });
    }
  });
}

export function useUpdateCase(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCaseInput & { id: number }) =>
      apiRequest<Case>(`/cases/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["cases", libraryId] });
      void queryClient.invalidateQueries({ queryKey: ["case", variables.id] });
    }
  });
}

export function useDeleteCase(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/cases/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", libraryId] });
    }
  });
}

export function useBatchCreateCases(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchCreateCaseInput) =>
      apiRequest<Case[]>(`/libraries/${libraryId}/cases/batch`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", libraryId] });
    }
  });
}

/** 用例版本列表项（与 caseVersionSchema 一致） */
export interface CaseVersion {
  id: number;
  caseId: number;
  versionNo: number;
  title: string;
  precondition: string | null;
  contentType: "text" | "step";
  textContent: string | null;
  textExpected: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
  caseType: string;
  tags: string[];
  steps: Array<{ stepOrder: number; action: string; expected?: string }>;
  createdAt: string;
}

export function useCaseVersions(caseId: number | null) {
  return useQuery({
    enabled: caseId != null && Number.isFinite(caseId),
    queryKey: ["case-versions", caseId],
    queryFn: () =>
      apiRequest<Paginated<CaseVersion>>(`/cases/${caseId}/versions`, {
        query: { page: 1, pageSize: 50, sortBy: "createdAt", sortOrder: "desc" }
      })
  });
}

export function useCaseVersion(caseId: number | null, versionNo: number | null) {
  return useQuery({
    enabled:
      caseId != null &&
      Number.isFinite(caseId) &&
      versionNo != null &&
      Number.isFinite(versionNo),
    queryKey: ["case-version", caseId, versionNo],
    queryFn: () =>
      apiRequest<CaseVersion>(`/cases/${caseId}/versions/${versionNo}`)
  });
}
