import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type {
  addPlanCasesByDirectorySchema,
  batchUpdatePlanCaseStatusSchema,
  createPlanCasesSchema,
  updatePlanCaseSchema
} from "@testhub/shared";
import { executionStatuses, historyReasonTypes, historySources } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import {
  caseVersions,
  cases,
  directories,
  libraries,
  planCaseRemarks,
  planCaseStatusHistories,
  planCases,
  plans
} from "../db/schema";
import { directoryIdsByRoot } from "./directory.service";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

export type HistoryReasonType = (typeof historyReasonTypes)[number];
export type HistorySource = (typeof historySources)[number];
export type ExecutionStatus = (typeof executionStatuses)[number];

type CreatePlanCasesInput = z.infer<typeof createPlanCasesSchema>;
type AddPlanCasesByDirectoryInput = z.infer<typeof addPlanCasesByDirectorySchema>;
type UpdatePlanCaseInput = z.infer<typeof updatePlanCaseSchema>;
type BatchUpdatePlanCaseStatusInput = z.infer<typeof batchUpdatePlanCaseStatusSchema>;

interface ListPlanCasesQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "executionStatus";
  sortOrder: "asc" | "desc";
  status?: ExecutionStatus;
}

interface ListHistoryQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
}

interface HistoryInput {
  planCaseId: number;
  planId: number;
  caseId: number;
  fromExecutionStatus: ExecutionStatus | null;
  toExecutionStatus: ExecutionStatus;
  fromCaseVersionId: number | null;
  toCaseVersionId: number | null;
  reasonType: HistoryReasonType;
  reasonNote?: string;
  actor: string;
  source: HistorySource;
  createdAt?: string;
}

function buildPlanCaseSort(sortBy: ListPlanCasesQuery["sortBy"], sortOrder: ListPlanCasesQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "createdAt") {
    return dir(planCases.createdAt);
  }
  if (sortBy === "executionStatus") {
    return dir(planCases.executionStatus);
  }
  return dir(planCases.updatedAt);
}

function buildHistorySort(sortOrder: ListHistoryQuery["sortOrder"]) {
  return sortOrder === "asc" ? asc(planCaseStatusHistories.createdAt) : desc(planCaseStatusHistories.createdAt);
}

function mapPlanCase(row: typeof planCases.$inferSelect) {
  return {
    id: row.id,
    planId: row.planId,
    caseId: row.caseId,
    caseVersionId: row.caseVersionId,
    executionStatus: row.executionStatus as ExecutionStatus,
    executedAt: row.executedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapHistory(row: typeof planCaseStatusHistories.$inferSelect) {
  return {
    id: row.id,
    planCaseId: row.planCaseId,
    planId: row.planId,
    caseId: row.caseId,
    fromExecutionStatus: row.fromExecutionStatus as ExecutionStatus | null,
    toExecutionStatus: row.toExecutionStatus as ExecutionStatus,
    fromCaseVersionId: row.fromCaseVersionId,
    toCaseVersionId: row.toCaseVersionId,
    reasonType: row.reasonType as HistoryReasonType,
    reasonNote: row.reasonNote,
    actor: row.actor,
    source: row.source as HistorySource,
    createdAt: row.createdAt
  };
}

function getPlanOrThrow(planId: number) {
  const plan = db.select().from(plans).where(eq(plans.id, planId)).get();
  assertOrThrow(plan, 404, "计划不存在");
  return plan;
}

function getCaseWithProject(caseId: number) {
  const row = db
    .select({
      id: cases.id,
      libraryId: cases.libraryId,
      latestVersionNo: cases.latestVersionNo,
      projectId: libraries.projectId
    })
    .from(cases)
    .innerJoin(libraries, eq(cases.libraryId, libraries.id))
    .where(eq(cases.id, caseId))
    .get();

  assertOrThrow(row, 404, "用例不存在");
  return row;
}

function getLatestCaseVersionOrThrow(caseId: number) {
  const row = db
    .select()
    .from(caseVersions)
    .where(eq(caseVersions.caseId, caseId))
    .orderBy(desc(caseVersions.versionNo))
    .limit(1)
    .get();

  assertOrThrow(row, 500, "用例版本缺失");
  return row;
}

export function appendStatusHistory(tx: typeof db, input: HistoryInput): void {
  tx.insert(planCaseStatusHistories)
    .values({
      planCaseId: input.planCaseId,
      planId: input.planId,
      caseId: input.caseId,
      fromExecutionStatus: input.fromExecutionStatus,
      toExecutionStatus: input.toExecutionStatus,
      fromCaseVersionId: input.fromCaseVersionId,
      toCaseVersionId: input.toCaseVersionId,
      reasonType: input.reasonType,
      reasonNote: input.reasonNote ?? null,
      actor: input.actor,
      source: input.source,
      createdAt: input.createdAt ?? nowIso()
    })
    .run();
}

export function listPlanCases(planId: number, query: ListPlanCasesQuery) {
  getPlanOrThrow(planId);
  const pagination = toPagination(query.page, query.pageSize);

  const whereClause = query.status
    ? and(eq(planCases.planId, planId), eq(planCases.executionStatus, query.status))
    : eq(planCases.planId, planId);

  const rows = db
    .select({
      planCase: planCases,
      caseTitle: cases.title,
      casePriority: cases.priority,
      caseType: cases.caseType,
      caseVersionNo: caseVersions.versionNo
    })
    .from(planCases)
    .innerJoin(cases, eq(planCases.caseId, cases.id))
    .innerJoin(caseVersions, eq(planCases.caseVersionId, caseVersions.id))
    .where(whereClause)
    .orderBy(buildPlanCaseSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const items = rows.map((row) => ({
    ...mapPlanCase(row.planCase),
    caseTitle: row.caseTitle,
    casePriority: row.casePriority,
    caseType: row.caseType,
    caseVersionNo: row.caseVersionNo
  }));

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(planCases).where(whereClause).get();
  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function addPlanCases(planId: number, input: CreatePlanCasesInput, actor: string, source: HistorySource) {
  const plan = getPlanOrThrow(planId);

  const uniqueCaseIds = Array.from(new Set(input.caseIds));
  const added: number[] = [];
  const skipped: number[] = [];

  db.transaction((tx) => {
    for (const caseId of uniqueCaseIds) {
      const caseRow = getCaseWithProject(caseId);
      if (caseRow.projectId !== plan.projectId) {
        throw new AppError(
          409,
          "用例所属项目与计划不一致，无法加入该计划"
        );
      }

      const existing = tx
        .select({ id: planCases.id })
        .from(planCases)
        .where(and(eq(planCases.planId, planId), eq(planCases.caseId, caseId)))
        .get();

      if (existing) {
        skipped.push(caseId);
        continue;
      }

      const latestVersion = getLatestCaseVersionOrThrow(caseId);
      const now = nowIso();
      const insertResult = tx
        .insert(planCases)
        .values({
          planId,
          caseId,
          caseVersionId: latestVersion.id,
          executionStatus: "pending",
          executedAt: null,
          createdAt: now,
          updatedAt: now
        })
        .run();

      const planCaseId = Number(insertResult.lastInsertRowid);
      appendStatusHistory(tx as unknown as typeof db, {
        planCaseId,
        planId,
        caseId,
        fromExecutionStatus: null,
        toExecutionStatus: "pending",
        fromCaseVersionId: null,
        toCaseVersionId: latestVersion.id,
        reasonType: "plan_case_created",
        actor,
        source,
        createdAt: now
      });

      added.push(caseId);
    }
  });

  return { added, skipped };
}

export function addPlanCasesByDirectory(
  planId: number,
  input: AddPlanCasesByDirectoryInput,
  actor: string,
  source: HistorySource
) {
  const plan = getPlanOrThrow(planId);

  const directory = db
    .select({
      id: directories.id,
      libraryId: directories.libraryId,
      projectId: libraries.projectId
    })
    .from(directories)
    .innerJoin(libraries, eq(directories.libraryId, libraries.id))
    .where(eq(directories.id, input.directoryId))
    .get();

  assertOrThrow(directory, 404, "目录不存在");
  if (directory.projectId !== plan.projectId) {
    throw new AppError(
      409,
      "目录所属项目与计划不一致，无法加入该计划"
    );
  }

  const directoryIds = directoryIdsByRoot(directory.libraryId, input.directoryId, input.recursive);
  const caseRows = db
    .select({ id: cases.id })
    .from(cases)
    .where(inArray(cases.directoryId, directoryIds))
    .all();

  const caseIds = caseRows.map((row) => row.id);
  if (caseIds.length === 0) {
    return { added: [], skipped: [] };
  }

  return addPlanCases(planId, { caseIds }, actor, source);
}

export function updatePlanCase(
  planId: number,
  planCaseId: number,
  input: UpdatePlanCaseInput,
  actor: string,
  source: HistorySource
) {
  getPlanOrThrow(planId);
  const current = db
    .select()
    .from(planCases)
    .where(and(eq(planCases.id, planCaseId), eq(planCases.planId, planId)))
    .get();

  assertOrThrow(current, 404, "计划用例不存在");

  const nextStatus = (input.executionStatus ?? current.executionStatus) as ExecutionStatus;
  const statusChanged = nextStatus !== current.executionStatus;
  const now = nowIso();

  const nextExecutedAt = statusChanged
    ? nextStatus === "pending"
      ? null
      : now
    : current.executedAt;

  db.transaction((tx) => {
    tx.update(planCases)
      .set({
        executionStatus: nextStatus,
        executedAt: nextExecutedAt,
        updatedAt: now
      })
      .where(eq(planCases.id, planCaseId))
      .run();

    if (statusChanged) {
      appendStatusHistory(tx as unknown as typeof db, {
        planCaseId,
        planId,
        caseId: current.caseId,
        fromExecutionStatus: current.executionStatus as ExecutionStatus,
        toExecutionStatus: nextStatus,
        fromCaseVersionId: current.caseVersionId,
        toCaseVersionId: current.caseVersionId,
        reasonType: "manual_update",
        actor,
        source,
        createdAt: now
      });
    }
  });

  const updated = db.select().from(planCases).where(eq(planCases.id, planCaseId)).get();
  assertOrThrow(updated, 500, "更新计划用例失败");
  return mapPlanCase(updated);
}

export function batchUpdatePlanCaseStatus(
  planId: number,
  input: BatchUpdatePlanCaseStatusInput,
  actor: string,
  source: HistorySource
) {
  getPlanOrThrow(planId);
  const targetIds = Array.from(new Set(input.planCaseIds));
  const rows = db
    .select()
    .from(planCases)
    .where(and(eq(planCases.planId, planId), inArray(planCases.id, targetIds)))
    .all();

  if (rows.length !== targetIds.length) {
    throw new AppError(404, "部分计划用例不存在");
  }

  const now = nowIso();
  db.transaction((tx) => {
    for (const row of rows) {
      if (row.executionStatus === input.executionStatus) {
        continue;
      }

      tx.update(planCases)
        .set({
          executionStatus: input.executionStatus,
          executedAt: input.executionStatus === "pending" ? null : now,
          updatedAt: now
        })
        .where(eq(planCases.id, row.id))
        .run();

      appendStatusHistory(tx as unknown as typeof db, {
        planCaseId: row.id,
        planId,
        caseId: row.caseId,
        fromExecutionStatus: row.executionStatus as ExecutionStatus,
        toExecutionStatus: input.executionStatus,
        fromCaseVersionId: row.caseVersionId,
        toCaseVersionId: row.caseVersionId,
        reasonType: "batch_update",
        actor,
        source,
        createdAt: now
      });
    }
  });
}

export function removePlanCase(planId: number, planCaseId: number) {
  getPlanOrThrow(planId);
  const result = db.delete(planCases).where(and(eq(planCases.id, planCaseId), eq(planCases.planId, planId))).run();
  if (result.changes === 0) {
    throw new AppError(404, "计划用例不存在");
  }
}

export function listPlanCaseHistory(planId: number, planCaseId: number, query: ListHistoryQuery) {
  getPlanOrThrow(planId);
  const pagination = toPagination(query.page, query.pageSize);

  const whereClause = and(eq(planCaseStatusHistories.planId, planId), eq(planCaseStatusHistories.planCaseId, planCaseId));

  const rows = db
    .select()
    .from(planCaseStatusHistories)
    .where(whereClause)
    .orderBy(buildHistorySort(query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(planCaseStatusHistories).where(whereClause).get();
  return toPaginatedResult(rows.map(mapHistory), Number(totalResult?.count ?? 0), pagination);
}

export function listPlanHistory(planId: number, query: ListHistoryQuery) {
  getPlanOrThrow(planId);
  const pagination = toPagination(query.page, query.pageSize);

  const rows = db
    .select()
    .from(planCaseStatusHistories)
    .where(eq(planCaseStatusHistories.planId, planId))
    .orderBy(buildHistorySort(query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(planCaseStatusHistories)
    .where(eq(planCaseStatusHistories.planId, planId))
    .get();

  return toPaginatedResult(rows.map(mapHistory), Number(totalResult?.count ?? 0), pagination);
}

// ── 备注 ──────────────────────────────────────────

interface ListRemarksQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt";
  sortOrder: "asc" | "desc";
}

export function addPlanCaseRemark(planId: number, planCaseId: number, content: string) {
  getPlanOrThrow(planId);
  const current = db
    .select()
    .from(planCases)
    .where(and(eq(planCases.id, planCaseId), eq(planCases.planId, planId)))
    .get();
  assertOrThrow(current, 404, "计划用例不存在");

  const now = nowIso();
  const result = db
    .insert(planCaseRemarks)
    .values({ planCaseId, content, createdAt: now })
    .run();

  return {
    id: Number(result.lastInsertRowid),
    planCaseId,
    content,
    createdAt: now
  };
}

export function listPlanCaseRemarks(planId: number, planCaseId: number, query: ListRemarksQuery) {
  getPlanOrThrow(planId);
  const pagination = toPagination(query.page, query.pageSize);

  const whereClause = eq(planCaseRemarks.planCaseId, planCaseId);
  const sortDir = query.sortOrder === "asc" ? asc(planCaseRemarks.createdAt) : desc(planCaseRemarks.createdAt);

  const rows = db
    .select()
    .from(planCaseRemarks)
    .where(whereClause)
    .orderBy(sortDir)
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all();

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(planCaseRemarks).where(whereClause).get();

  const items = rows.map((row) => ({
    id: row.id,
    planCaseId: row.planCaseId,
    content: row.content,
    createdAt: row.createdAt
  }));

  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function syncCaseVersionToOpenPlans(caseId: number, newCaseVersionId: number) {
  const targets = db
    .select({
      planCaseId: planCases.id,
      planId: planCases.planId,
      caseId: planCases.caseId,
      fromStatus: planCases.executionStatus,
      fromCaseVersionId: planCases.caseVersionId,
      planStatus: plans.status
    })
    .from(planCases)
    .innerJoin(plans, eq(planCases.planId, plans.id))
    .where(eq(planCases.caseId, caseId))
    .all()
    .filter((row) => row.planStatus === "draft" || row.planStatus === "in_progress");

  if (targets.length === 0) {
    return 0;
  }

  const now = nowIso();
  db.transaction((tx) => {
    for (const target of targets) {
      tx.update(planCases)
        .set({
          caseVersionId: newCaseVersionId,
          executionStatus: "pending",
          executedAt: null,
          updatedAt: now
        })
        .where(eq(planCases.id, target.planCaseId))
        .run();

      appendStatusHistory(tx as unknown as typeof db, {
        planCaseId: target.planCaseId,
        planId: target.planId,
        caseId: target.caseId,
        fromExecutionStatus: target.fromStatus as ExecutionStatus,
        toExecutionStatus: "pending",
        fromCaseVersionId: target.fromCaseVersionId,
        toCaseVersionId: newCaseVersionId,
        reasonType: "case_version_sync",
        actor: "system",
        source: "system",
        createdAt: now
      });
    }
  });

  return targets.length;
}
