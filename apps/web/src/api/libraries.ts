import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateLibraryInput, Library, UpdateLibraryInput } from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

export function useLibraries(projectId: number) {
  return useQuery({
    enabled: Number.isFinite(projectId),
    queryKey: ["libraries", projectId],
    queryFn: () =>
      apiRequest<Paginated<Library>>(`/projects/${projectId}/libraries`, {
        query: {
          page: 1,
          pageSize: 100,
          sortBy: "updatedAt",
          sortOrder: "desc"
        }
      })
  });
}

export function useLibrary(libraryId: number) {
  return useQuery({
    enabled: Number.isFinite(libraryId),
    queryKey: ["library", libraryId],
    queryFn: () => apiRequest<Library>(`/libraries/${libraryId}`)
  });
}

export function useCreateLibrary(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLibraryInput) =>
      apiRequest<Library>(`/projects/${projectId}/libraries`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["libraries", projectId] });
    }
  });
}

export function useUpdateLibrary(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateLibraryInput & { id: number }) =>
      apiRequest<Library>(`/libraries/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["libraries", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["library", variables.id] });
    }
  });
}

export function useDeleteLibrary(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/libraries/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["libraries", projectId] });
    }
  });
}
