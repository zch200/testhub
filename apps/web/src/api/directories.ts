import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDirectoryInput,
  DirectoryTree,
  UpdateDirectoryInput
} from "@testhub/shared";
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

export function useCreateDirectory(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDirectoryInput) =>
      apiRequest(`/libraries/${libraryId}/directories`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["directory-tree", libraryId] });
    }
  });
}

export function useUpdateDirectory(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateDirectoryInput & { id: number }) =>
      apiRequest(`/directories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["directory-tree", libraryId] });
    }
  });
}

export type DeleteDirectoryOptions = {
  id: number;
  caseMoveTo?: "uncategorized" | "parent";
};

export function useDeleteDirectory(libraryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, caseMoveTo }: DeleteDirectoryOptions) =>
      apiRequest(`/directories/${id}`, {
        method: "DELETE",
        query: caseMoveTo ? { caseMoveTo } : undefined
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["directory-tree", libraryId] });
    }
  });
}
