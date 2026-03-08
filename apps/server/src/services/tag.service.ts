import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { createTagSchema } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import { libraries, tags } from "../db/schema";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

interface ListTagsQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "name";
  sortOrder: "asc" | "desc";
}

type CreateTagInput = z.infer<typeof createTagSchema>;

function mapTag(row: typeof tags.$inferSelect) {
  return {
    id: row.id,
    libraryId: row.libraryId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function buildSort(sortBy: ListTagsQuery["sortBy"], sortOrder: ListTagsQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "createdAt") {
    return dir(tags.createdAt);
  }
  if (sortBy === "updatedAt") {
    return dir(tags.updatedAt);
  }
  return dir(tags.name);
}

export function listTags(libraryId: number, query: ListTagsQuery) {
  const pagination = toPagination(query.page, query.pageSize);
  const items = db
    .select()
    .from(tags)
    .where(eq(tags.libraryId, libraryId))
    .orderBy(buildSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all()
    .map(mapTag);

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(tags)
    .where(eq(tags.libraryId, libraryId))
    .get();

  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function createTag(libraryId: number, input: CreateTagInput) {
  const library = db.select({ id: libraries.id }).from(libraries).where(eq(libraries.id, libraryId)).get();
  assertOrThrow(library, 404, "用例库不存在");

  const existing = db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.libraryId, libraryId), eq(tags.name, input.name)))
    .get();

  if (existing) {
    throw new AppError(409, `标签「${input.name}」在本用例库中已存在`);
  }

  const now = nowIso();
  const result = db
    .insert(tags)
    .values({
      libraryId,
      name: input.name,
      createdAt: now,
      updatedAt: now
    })
    .run();

  const row = db.select().from(tags).where(eq(tags.id, Number(result.lastInsertRowid))).get();
  assertOrThrow(row, 500, "创建标签失败");
  return mapTag(row);
}

export function deleteTag(id: number) {
  const result = db.delete(tags).where(eq(tags.id, id)).run();
  if (result.changes === 0) {
    throw new AppError(404, "标签不存在");
  }
}
