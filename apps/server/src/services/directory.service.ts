import { asc, eq, inArray } from "drizzle-orm";
import type { createDirectorySchema, updateDirectorySchema } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import { cases, directories, libraries } from "../db/schema";
import { AppError, assertOrThrow } from "../utils/errors";
import { nowIso } from "../utils/time";

type CreateDirectoryInput = z.infer<typeof createDirectorySchema>;
type UpdateDirectoryInput = z.infer<typeof updateDirectorySchema>;

export interface DirectoryTreeNode {
  id: number;
  libraryId: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children: DirectoryTreeNode[];
}

function mapDirectory(row: typeof directories.$inferSelect) {
  return {
    id: row.id,
    libraryId: row.libraryId,
    parentId: row.parentId,
    name: row.name,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function buildDirectoryTree(rows: typeof directories.$inferSelect[]): DirectoryTreeNode[] {
  const nodeMap = new Map<number, DirectoryTreeNode>();

  for (const row of rows) {
    nodeMap.set(row.id, {
      ...mapDirectory(row),
      children: []
    });
  }

  const roots: DirectoryTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: DirectoryTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  };

  sortRecursive(roots);
  return roots;
}

function collectSubtreeIds(rootId: number, rows: typeof directories.$inferSelect[]): number[] {
  const childrenByParent = new Map<number, number[]>();
  for (const row of rows) {
    if (row.parentId === null) {
      continue;
    }

    const children = childrenByParent.get(row.parentId) ?? [];
    children.push(row.id);
    childrenByParent.set(row.parentId, children);
  }

  const result: number[] = [];
  const stack = [rootId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    result.push(current);
    const children = childrenByParent.get(current) ?? [];
    for (const childId of children) {
      stack.push(childId);
    }
  }

  return result;
}

export function listDirectoryTree(libraryId: number): DirectoryTreeNode[] {
  const rows = db
    .select()
    .from(directories)
    .where(eq(directories.libraryId, libraryId))
    .orderBy(asc(directories.sortOrder), asc(directories.name))
    .all();

  return buildDirectoryTree(rows);
}

export function createDirectory(libraryId: number, input: CreateDirectoryInput) {
  const library = db.select({ id: libraries.id }).from(libraries).where(eq(libraries.id, libraryId)).get();
  assertOrThrow(library, 404, "用例库不存在");

  if (input.parentId !== null && input.parentId !== undefined) {
    const parent = db
      .select({ id: directories.id, libraryId: directories.libraryId })
      .from(directories)
      .where(eq(directories.id, input.parentId))
      .get();

    assertOrThrow(parent, 404, "父目录不存在");
    if (parent.libraryId !== libraryId) {
      throw new AppError(400, "父目录须属于同一用例库");
    }
  }

  const now = nowIso();
  const result = db
    .insert(directories)
    .values({
      libraryId,
      parentId: input.parentId ?? null,
      name: input.name,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now
    })
    .run();

  const row = db.select().from(directories).where(eq(directories.id, Number(result.lastInsertRowid))).get();
  assertOrThrow(row, 500, "创建目录失败");
  return mapDirectory(row);
}

export function updateDirectory(id: number, input: UpdateDirectoryInput) {
  const current = db.select().from(directories).where(eq(directories.id, id)).get();
  assertOrThrow(current, 404, "目录不存在");

  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) {
      throw new AppError(400, "目录不能将自身设为父目录");
    }

    const parent = db
      .select({ id: directories.id, libraryId: directories.libraryId })
      .from(directories)
      .where(eq(directories.id, input.parentId))
      .get();

    assertOrThrow(parent, 404, "父目录不存在");
    if (parent.libraryId !== current.libraryId) {
      throw new AppError(400, "父目录须属于同一用例库");
    }
  }

  const values: Partial<typeof directories.$inferInsert> = {
    updatedAt: nowIso()
  };

  if (input.name !== undefined) {
    values.name = input.name;
  }
  if (input.parentId !== undefined) {
    values.parentId = input.parentId;
  }
  if (input.sortOrder !== undefined) {
    values.sortOrder = input.sortOrder;
  }

  db.update(directories).set(values).where(eq(directories.id, id)).run();
  const row = db.select().from(directories).where(eq(directories.id, id)).get();
  assertOrThrow(row, 500, "更新目录失败");
  return mapDirectory(row);
}

export function deleteDirectory(id: number, caseMoveTo: "uncategorized" | "parent" = "uncategorized") {
  const current = db.select().from(directories).where(eq(directories.id, id)).get();
  assertOrThrow(current, 404, "目录不存在");

  const rows = db
    .select()
    .from(directories)
    .where(eq(directories.libraryId, current.libraryId))
    .all();

  const subtreeIds = collectSubtreeIds(id, rows);
  const moveTarget = caseMoveTo === "parent" ? current.parentId : null;

  db.transaction((tx) => {
    if (subtreeIds.length > 0) {
      tx.update(cases)
        .set({
          directoryId: moveTarget,
          updatedAt: nowIso()
        })
        .where(inArray(cases.directoryId, subtreeIds))
        .run();

      tx.delete(directories).where(inArray(directories.id, subtreeIds)).run();
    }
  });
}

export function getDirectoryById(id: number) {
  const row = db.select().from(directories).where(eq(directories.id, id)).get();
  assertOrThrow(row, 404, "目录不存在");
  return mapDirectory(row);
}

export function listDirectoriesFlat(libraryId: number) {
  return db
    .select()
    .from(directories)
    .where(eq(directories.libraryId, libraryId))
    .orderBy(asc(directories.sortOrder), asc(directories.name))
    .all()
    .map(mapDirectory);
}

export function directoryIdsByRoot(libraryId: number, rootId: number, recursive: boolean): number[] {
  const allDirectories = db
    .select()
    .from(directories)
    .where(eq(directories.libraryId, libraryId))
    .all();

  const root = allDirectories.find((row) => row.id === rootId);
  assertOrThrow(root, 404, "目录不存在");

  if (!recursive) {
    return [rootId];
  }

  return collectSubtreeIds(rootId, allDirectories);
}
