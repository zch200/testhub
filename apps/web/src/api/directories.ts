import { useQuery } from "@tanstack/react-query";
import type { DirectoryTree } from "@testhub/shared";
import { apiRequest } from "./client";

/** Tree node shape returned by GET /libraries/:libraryId/directories */
export type DirectoryTreeNode = DirectoryTree;

export function useDirectoryTree(libraryId: number) {
  return useQuery({
    enabled: Number.isFinite(libraryId),
    queryKey: ["directory-tree", libraryId],
    queryFn: () =>
      apiRequest<DirectoryTreeNode[]>(`/libraries/${libraryId}/directories`)
  });
}
