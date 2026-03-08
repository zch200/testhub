import { asc, desc, eq, sql } from "drizzle-orm";
import type { createProjectSchema, updateProjectSchema } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import { projects } from "../db/schema";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

interface ListProjectsQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "name";
  sortOrder: "asc" | "desc";
}

type CreateProjectInput = z.infer<typeof createProjectSchema>;
type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

function mapProject(row: typeof projects.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function buildSort(sortBy: ListProjectsQuery["sortBy"], sortOrder: ListProjectsQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "name") {
    return dir(projects.name);
  }
  if (sortBy === "createdAt") {
    return dir(projects.createdAt);
  }
  return dir(projects.updatedAt);
}

export function listProjects(query: ListProjectsQuery) {
  const pagination = toPagination(query.page, query.pageSize);
  const items = db
    .select()
    .from(projects)
    .orderBy(buildSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all()
    .map(mapProject);

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(projects).get();
  const total = Number(totalResult?.count ?? 0);

  return toPaginatedResult(items, total, pagination);
}

export function getProjectById(id: number) {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  assertOrThrow(row, 404, "项目不存在");
  return mapProject(row);
}

export function createProject(input: CreateProjectInput) {
  const now = nowIso();
  const result = db
    .insert(projects)
    .values({
      name: input.name,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run();

  return getProjectById(Number(result.lastInsertRowid));
}

export function updateProject(id: number, input: UpdateProjectInput) {
  const existing = db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).get();
  assertOrThrow(existing, 404, "项目不存在");

  const values: Partial<typeof projects.$inferInsert> = {
    updatedAt: nowIso()
  };

  if (input.name !== undefined) {
    values.name = input.name;
  }
  if (input.description !== undefined) {
    values.description = input.description;
  }

  db.update(projects).set(values).where(eq(projects.id, id)).run();
  return getProjectById(id);
}

export function deleteProject(id: number) {
  const result = db.delete(projects).where(eq(projects.id, id)).run();
  if (result.changes === 0) {
    throw new AppError(404, "项目不存在");
  }
}
