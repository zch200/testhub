import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTagInput, Tag } from "@testhub/shared";
import { apiRequest } from "./client";
import type { Paginated } from "./types";

export function useTags(libraryId: number) {
  return useQuery({
    enabled: Number.isFinite(libraryId),
    queryKey: ["tags", libraryId],
    queryFn: () =>
      apiRequest<Paginated<Tag>>(`/libraries/${libraryId}/tags`, {
        query: { page: 1, pageSize: 200, sortBy: "name", sortOrder: "asc" }
      })
  });
}

export function useCreateTag(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTagInput) =>
      apiRequest<Tag>(`/libraries/${libraryId}/tags`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags", libraryId] });
    }
  });
}

export function useDeleteTag(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) =>
      apiRequest<void>(`/tags/${tagId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tags", libraryId] });
    }
  });
}
