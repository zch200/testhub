import { useQuery } from "@tanstack/react-query";
import type { Tag } from "@testhub/shared";
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
