import { useQuery } from "@tanstack/react-query";
import type { Library } from "@testhub/shared";
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
