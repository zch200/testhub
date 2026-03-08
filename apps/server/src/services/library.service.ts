import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { createLibrarySchema, updateLibrarySchema } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import { libraries, projects } from "../db/schema";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

interface ListLibrariesQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "name" | "code";
  sortOrder: "asc" | "desc";
}

type CreateLibraryInput = z.infer<typeof createLibrarySchema>;
type UpdateLibraryInput = z.infer<typeof updateLibrarySchema>;

function mapLibrary(row: typeof libraries.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    code: row.code,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function buildSort(sortBy: ListLibrariesQuery["sortBy"], sortOrder: ListLibrariesQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "name") {
    return dir(libraries.name);
  }
  if (sortBy === "code") {
    return dir(libraries.code);
  }
  if (sortBy === "createdAt") {
    return dir(libraries.createdAt);
  }
  return dir(libraries.updatedAt);
}

export function listLibraries(projectId: number, query: ListLibrariesQuery) {
  const pagination = toPagination(query.page, query.pageSize);
  const items = db
    .select()
    .from(libraries)
    .where(eq(libraries.projectId, projectId))
    .orderBy(buildSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all()
    .map(mapLibrary);

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(libraries)
    .where(eq(libraries.projectId, projectId))
    .get();

  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function getLibraryById(id: number) {
  const row = db.select().from(libraries).where(eq(libraries.id, id)).get();
  assertOrThrow(row, 404, "用例库不存在");
  return mapLibrary(row);
}

export function createLibrary(projectId: number, input: CreateLibraryInput) {
  const project = db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).get();
  assertOrThrow(project, 404, "项目不存在");

  const duplicated = db
    .select({ id: libraries.id })
    .from(libraries)
    .where(and(eq(libraries.projectId, projectId), eq(libraries.code, input.code)))
    .get();

  if (duplicated) {
    throw new AppError(409, `标识码 ${input.code} 在本项目中已存在`);
  }

  const now = nowIso();
  const result = db
    .insert(libraries)
    .values({
      projectId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run();

  return getLibraryById(Number(result.lastInsertRowid));
}

export function updateLibrary(id: number, input: UpdateLibraryInput) {
  const current = db.select().from(libraries).where(eq(libraries.id, id)).get();
  assertOrThrow(current, 404, "用例库不存在");

  if (input.code && input.code !== current.code) {
    const duplicated = db
      .select({ id: libraries.id })
      .from(libraries)
      .where(and(eq(libraries.projectId, current.projectId), eq(libraries.code, input.code)))
      .get();

    if (duplicated) {
      throw new AppError(409, `标识码 ${input.code} 在本项目中已存在`);
    }
  }

  const values: Partial<typeof libraries.$inferInsert> = {
    updatedAt: nowIso()
  };

  if (input.name !== undefined) {
    values.name = input.name;
  }
  if (input.code !== undefined) {
    values.code = input.code;
  }
  if (input.description !== undefined) {
    values.description = input.description;
  }

  db.update(libraries).set(values).where(eq(libraries.id, id)).run();
  return getLibraryById(id);
}

export function deleteLibrary(id: number) {
  const result = db.delete(libraries).where(eq(libraries.id, id)).run();
  if (result.changes === 0) {
    throw new AppError(404, "用例库不存在");
  }
}
