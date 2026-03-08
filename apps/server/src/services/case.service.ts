import { and, asc, desc, eq, exists, inArray, like, sql } from "drizzle-orm";
import type { batchCreateCaseSchema, createCaseSchema, updateCaseSchema } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import {
  caseSteps,
  caseTags,
  caseVersions,
  cases,
  directories,
  libraries,
  planCases,
  tags
} from "../db/schema";
import { parseStepsJson, parseTagsJson } from "./helpers";
import { syncCaseVersionToOpenPlans } from "./plan-case.service";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

interface ListCasesQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "title" | "priority";
  sortOrder: "asc" | "desc";
  directoryId?: number;
  priority?: "P0" | "P1" | "P2" | "P3";
  type?: "functional" | "performance" | "api" | "ui" | "other";
  tag?: string;
  keyword?: string;
}

interface ListCaseVersionsQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
}

type CreateCaseInput = z.infer<typeof createCaseSchema>;
type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
type BatchCreateCaseInput = z.infer<typeof batchCreateCaseSchema>;

function buildSort(sortBy: ListCasesQuery["sortBy"], sortOrder: ListCasesQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "createdAt") {
    return dir(cases.createdAt);
  }
  if (sortBy === "title") {
    return dir(cases.title);
  }
  if (sortBy === "priority") {
    return dir(cases.priority);
  }
  return dir(cases.updatedAt);
}

function mapCase(row: typeof cases.$inferSelect, tagNames: string[], steps: Array<{ stepOrder: number; action: string; expected?: string }>) {
  return {
    id: row.id,
    libraryId: row.libraryId,
    directoryId: row.directoryId,
    latestVersionNo: row.latestVersionNo,
    title: row.title,
    precondition: row.precondition,
    contentType: row.contentType,
    textContent: row.textContent,
    textExpected: row.textExpected,
    priority: row.priority,
    caseType: row.caseType,
    tags: tagNames,
    steps,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapCaseVersion(row: typeof caseVersions.$inferSelect) {
  return {
    id: row.id,
    caseId: row.caseId,
    versionNo: row.versionNo,
    title: row.title,
    precondition: row.precondition,
    contentType: row.contentType,
    textContent: row.textContent,
    textExpected: row.textExpected,
    priority: row.priority,
    caseType: row.caseType,
    tags: parseTagsJson(row.tagsJson),
    steps: parseStepsJson(row.stepsJson),
    createdAt: row.createdAt
  };
}

function normalizeTags(tagsInput: string[]): string[] {
  const clean = tagsInput.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return Array.from(new Set(clean));
}

function normalizeSteps(stepsInput: Array<{ stepOrder: number; action: string; expected?: string }>) {
  return stepsInput
    .map((step, index) => ({
      stepOrder: step.stepOrder || index + 1,
      action: step.action,
      expected: step.expected
    }))
    .sort((a, b) => a.stepOrder - b.stepOrder);
}

function validateDirectoryInLibrary(libraryId: number, directoryId: number | null | undefined): void {
  if (!directoryId) {
    return;
  }

  const directory = db
    .select({ id: directories.id, libraryId: directories.libraryId })
    .from(directories)
    .where(eq(directories.id, directoryId))
    .get();

  assertOrThrow(directory, 404, "目录不存在");
  if (directory.libraryId !== libraryId) {
    throw new AppError(400, "目录须属于同一用例库");
  }
}

function ensureLibraryExists(libraryId: number): void {
  const library = db.select({ id: libraries.id }).from(libraries).where(eq(libraries.id, libraryId)).get();
  assertOrThrow(library, 404, "用例库不存在");
}

function loadCaseTags(caseId: number): string[] {
  const rows = db
    .select({ name: tags.name })
    .from(caseTags)
    .innerJoin(tags, eq(caseTags.tagId, tags.id))
    .where(eq(caseTags.caseId, caseId))
    .orderBy(asc(tags.name))
    .all();

  return rows.map((row) => row.name);
}

function loadCaseSteps(caseId: number): Array<{ stepOrder: number; action: string; expected?: string }> {
  const rows = db
    .select()
    .from(caseSteps)
    .where(eq(caseSteps.caseId, caseId))
    .orderBy(asc(caseSteps.stepOrder))
    .all();

  return rows.map((row) => ({
    stepOrder: row.stepOrder,
    action: row.action,
    expected: row.expected ?? undefined
  }));
}

function replaceCaseSteps(
  tx: typeof db,
  caseId: number,
  stepsInput: Array<{ stepOrder: number; action: string; expected?: string }>
): void {
  tx.delete(caseSteps).where(eq(caseSteps.caseId, caseId)).run();
  if (stepsInput.length === 0) {
    return;
  }

  tx.insert(caseSteps)
    .values(
      stepsInput.map((step) => ({
        caseId,
        stepOrder: step.stepOrder,
        action: step.action,
        expected: step.expected ?? null
      }))
    )
    .run();
}

function upsertTags(tx: typeof db, libraryId: number, tagNames: string[]): number[] {
  if (tagNames.length === 0) {
    return [];
  }

  const existing = tx.select().from(tags).where(and(eq(tags.libraryId, libraryId), inArray(tags.name, tagNames))).all();
  const existingByName = new Map(existing.map((row) => [row.name, row.id]));
  const missing = tagNames.filter((name) => !existingByName.has(name));

  if (missing.length > 0) {
    const now = nowIso();
    tx.insert(tags)
      .values(
        missing.map((name) => ({
          libraryId,
          name,
          createdAt: now,
          updatedAt: now
        }))
      )
      .run();
  }

  const all = tx.select().from(tags).where(and(eq(tags.libraryId, libraryId), inArray(tags.name, tagNames))).all();
  return tagNames.map((name) => {
    const row = all.find((entry) => entry.name === name);
    if (!row) {
      throw new AppError(500, `创建标签「${name}」失败`);
    }
    return row.id;
  });
}

function replaceCaseTags(tx: typeof db, caseId: number, libraryId: number, tagNames: string[]): void {
  tx.delete(caseTags).where(eq(caseTags.caseId, caseId)).run();
  if (tagNames.length === 0) {
    return;
  }

  const tagIds = upsertTags(tx, libraryId, tagNames);
  tx.insert(caseTags)
    .values(
      tagIds.map((tagId) => ({
        caseId,
        tagId
      }))
    )
    .run();
}

function insertCaseVersion(
  tx: typeof db,
  caseId: number,
  versionNo: number,
  payload: {
    title: string;
    precondition: string | null;
    contentType: string;
    textContent: string | null;
    textExpected: string | null;
    priority: string;
    caseType: string;
    tags: string[];
    steps: Array<{ stepOrder: number; action: string; expected?: string }>;
  }
): number {
  const now = nowIso();
  const result = tx
    .insert(caseVersions)
    .values({
      caseId,
      versionNo,
      title: payload.title,
      precondition: payload.precondition,
      contentType: payload.contentType,
      textContent: payload.textContent,
      textExpected: payload.textExpected,
      priority: payload.priority,
      caseType: payload.caseType,
      stepsJson: JSON.stringify(payload.steps),
      tagsJson: JSON.stringify(payload.tags),
      createdAt: now
    })
    .run();

  return Number(result.lastInsertRowid);
}

function ensureContentValid(contentType: string, textContent: string | null, steps: Array<{ stepOrder: number; action: string }>) {
  if (contentType === "text" && (!textContent || textContent.trim().length === 0)) {
    throw new AppError(400, "文本类型用例须填写正文内容");
  }
  if (contentType === "step" && steps.length === 0) {
    throw new AppError(400, "步骤类型用例须至少添加一步");
  }
}

export function getCaseById(id: number) {
  const row = db.select().from(cases).where(eq(cases.id, id)).get();
  assertOrThrow(row, 404, "用例不存在");

  const tagNames = loadCaseTags(id);
  const steps = loadCaseSteps(id);
  return mapCase(row, tagNames, steps);
}

export function listCases(libraryId: number, query: ListCasesQuery) {
  ensureLibraryExists(libraryId);
  const pagination = toPagination(query.page, query.pageSize);

  let whereClause = eq(cases.libraryId, libraryId);

  if (query.directoryId) {
    whereClause = and(whereClause, eq(cases.directoryId, query.directoryId)) as typeof whereClause;
  }
  if (query.priority) {
    whereClause = and(whereClause, eq(cases.priority, query.priority)) as typeof whereClause;
  }
  if (query.type) {
    whereClause = and(whereClause, eq(cases.caseType, query.type)) as typeof whereClause;
  }
  if (query.keyword) {
    whereClause = and(whereClause, like(cases.title, `%${query.keyword}%`)) as typeof whereClause;
  }
  if (query.tag) {
    whereClause = and(
      whereClause,
      exists(
        db
          .select({ one: sql`1` })
          .from(caseTags)
          .innerJoin(tags, eq(caseTags.tagId, tags.id))
          .where(and(eq(caseTags.caseId, cases.id), eq(tags.name, query.tag)))
      )
    ) as typeof whereClause;
  }

  const rows = db
    .select()
    .from(cases)
    .where(whereClause)
    .orderBy(buildSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const items = rows.map((row) => mapCase(row, loadCaseTags(row.id), loadCaseSteps(row.id)));
  const totalResult = db.select({ count: sql<number>`count(*)` }).from(cases).where(whereClause).get();
  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function createCase(libraryId: number, input: CreateCaseInput) {
  ensureLibraryExists(libraryId);
  validateDirectoryInLibrary(libraryId, input.directoryId);

  const tagNames = normalizeTags(input.tags ?? []);
  const steps = normalizeSteps(input.steps ?? []);
  const textContent = input.textContent ?? null;
  ensureContentValid(input.contentType, textContent, steps);

  const now = nowIso();
  let caseId = 0;

  db.transaction((tx) => {
    const insertResult = tx
      .insert(cases)
      .values({
        libraryId,
        directoryId: input.directoryId ?? null,
        latestVersionNo: 1,
        title: input.title,
        precondition: input.precondition ?? null,
        contentType: input.contentType,
        textContent,
        textExpected: input.textExpected ?? null,
        priority: input.priority,
        caseType: input.caseType,
        createdAt: now,
        updatedAt: now
      })
      .run();

    caseId = Number(insertResult.lastInsertRowid);
    replaceCaseSteps(tx as unknown as typeof db, caseId, steps);
    replaceCaseTags(tx as unknown as typeof db, caseId, libraryId, tagNames);

    insertCaseVersion(tx as unknown as typeof db, caseId, 1, {
      title: input.title,
      precondition: input.precondition ?? null,
      contentType: input.contentType,
      textContent,
      textExpected: input.textExpected ?? null,
      priority: input.priority,
      caseType: input.caseType,
      tags: tagNames,
      steps
    });
  });

  return getCaseById(caseId);
}

export function batchCreateCases(libraryId: number, input: BatchCreateCaseInput) {
  const result = [];
  for (const caseInput of input.cases) {
    result.push(createCase(libraryId, caseInput));
  }
  return result;
}

export function updateCase(id: number, input: UpdateCaseInput) {
  const current = getCaseById(id);

  const nextDirectoryId = input.directoryId !== undefined ? input.directoryId : current.directoryId;
  validateDirectoryInLibrary(current.libraryId, nextDirectoryId);

  const nextTags = input.tags ? normalizeTags(input.tags) : current.tags;
  const nextSteps = input.steps ? normalizeSteps(input.steps) : current.steps;

  const nextContentType = input.contentType ?? current.contentType;
  const nextTextContent = input.textContent !== undefined ? input.textContent ?? null : current.textContent;
  const nextTextExpected = input.textExpected !== undefined ? input.textExpected ?? null : current.textExpected;

  ensureContentValid(nextContentType, nextTextContent, nextSteps);

  const nextPayload = {
    title: input.title ?? current.title,
    precondition: input.precondition !== undefined ? input.precondition ?? null : current.precondition,
    contentType: nextContentType,
    textContent: nextTextContent,
    textExpected: nextTextExpected,
    priority: input.priority ?? current.priority,
    caseType: input.caseType ?? current.caseType,
    tags: nextTags,
    steps: nextSteps
  };

  let newVersionId = 0;
  const nextVersionNo = current.latestVersionNo + 1;
  const now = nowIso();

  db.transaction((tx) => {
    tx.update(cases)
      .set({
        directoryId: nextDirectoryId ?? null,
        latestVersionNo: nextVersionNo,
        title: nextPayload.title,
        precondition: nextPayload.precondition,
        contentType: nextPayload.contentType,
        textContent: nextPayload.textContent,
        textExpected: nextPayload.textExpected,
        priority: nextPayload.priority,
        caseType: nextPayload.caseType,
        updatedAt: now
      })
      .where(eq(cases.id, id))
      .run();

    replaceCaseSteps(tx as unknown as typeof db, id, nextPayload.steps);
    replaceCaseTags(tx as unknown as typeof db, id, current.libraryId, nextPayload.tags);

    newVersionId = insertCaseVersion(tx as unknown as typeof db, id, nextVersionNo, nextPayload);
  });

  syncCaseVersionToOpenPlans(id, newVersionId);
  return getCaseById(id);
}

export function deleteCase(id: number) {
  const inPlan = db.select({ id: planCases.id }).from(planCases).where(eq(planCases.caseId, id)).get();
  if (inPlan) {
    throw new AppError(409, "该用例已被测试计划引用，无法删除");
  }

  const result = db.delete(cases).where(eq(cases.id, id)).run();
  if (result.changes === 0) {
    throw new AppError(404, "用例不存在");
  }
}

export function listCaseVersions(caseId: number, query: ListCaseVersionsQuery) {
  const current = db.select({ id: cases.id }).from(cases).where(eq(cases.id, caseId)).get();
  assertOrThrow(current, 404, "用例不存在");

  const pagination = toPagination(query.page, query.pageSize);
  const rows = db
    .select()
    .from(caseVersions)
    .where(eq(caseVersions.caseId, caseId))
    .orderBy(query.sortOrder === "asc" ? asc(caseVersions.createdAt) : desc(caseVersions.createdAt))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(caseVersions)
    .where(eq(caseVersions.caseId, caseId))
    .get();

  return toPaginatedResult(rows.map(mapCaseVersion), Number(totalResult?.count ?? 0), pagination);
}

export function getCaseVersion(caseId: number, versionNo: number) {
  const row = db
    .select()
    .from(caseVersions)
    .where(and(eq(caseVersions.caseId, caseId), eq(caseVersions.versionNo, versionNo)))
    .get();

  assertOrThrow(row, 404, "用例版本不存在");
  return mapCaseVersion(row);
}
