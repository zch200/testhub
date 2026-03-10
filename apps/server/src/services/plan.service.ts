import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { createPlanSchema, updatePlanSchema } from "@testhub/shared";
import type { PlanStatus } from "@testhub/shared";
import type { z } from "zod";
import { db } from "../db";
import { planCases, plans, projects } from "../db/schema";
import { AppError, assertOrThrow } from "../utils/errors";
import { offsetFromPagination, toPaginatedResult, toPagination } from "../utils/pagination";
import { nowIso } from "../utils/time";

interface ListPlansQuery {
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "name" | "startDate" | "endDate";
  sortOrder: "asc" | "desc";
  status?: "draft" | "in_progress" | "completed" | "archived";
}

type CreatePlanInput = z.infer<typeof createPlanSchema>;
type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

function buildSort(sortBy: ListPlansQuery["sortBy"], sortOrder: ListPlansQuery["sortOrder"]) {
  const dir = sortOrder === "asc" ? asc : desc;
  if (sortBy === "createdAt") {
    return dir(plans.createdAt);
  }
  if (sortBy === "name") {
    return dir(plans.name);
  }
  if (sortBy === "startDate") {
    return dir(plans.startDate);
  }
  if (sortBy === "endDate") {
    return dir(plans.endDate);
  }
  return dir(plans.updatedAt);
}

function mapPlan(row: typeof plans.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as PlanStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function listPlans(projectId: number, query: ListPlansQuery) {
  const pagination = toPagination(query.page, query.pageSize);

  const whereClause = query.status
    ? and(eq(plans.projectId, projectId), eq(plans.status, query.status))
    : eq(plans.projectId, projectId);

  const items = db
    .select()
    .from(plans)
    .where(whereClause)
    .orderBy(buildSort(query.sortBy, query.sortOrder))
    .limit(pagination.pageSize)
    .offset(offsetFromPagination(pagination))
    .all()
    .map(mapPlan);

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(plans).where(whereClause).get();
  return toPaginatedResult(items, Number(totalResult?.count ?? 0), pagination);
}

export function getPlanById(id: number) {
  const row = db.select().from(plans).where(eq(plans.id, id)).get();
  assertOrThrow(row, 404, "计划不存在");
  return mapPlan(row);
}

export function createPlan(projectId: number, input: CreatePlanInput) {
  const project = db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).get();
  assertOrThrow(project, 404, "项目不存在");

  const now = nowIso();
  const result = db
    .insert(plans)
    .values({
      projectId,
      name: input.name,
      description: input.description ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: input.status,
      createdAt: now,
      updatedAt: now
    })
    .run();

  return getPlanById(Number(result.lastInsertRowid));
}

export function updatePlan(id: number, input: UpdatePlanInput) {
  const existing = db.select().from(plans).where(eq(plans.id, id)).get();
  assertOrThrow(existing, 404, "计划不存在");

  const values: Partial<typeof plans.$inferInsert> = {
    updatedAt: nowIso()
  };

  if (input.name !== undefined) {
    values.name = input.name;
  }
  if (input.description !== undefined) {
    values.description = input.description;
  }
  if (input.startDate !== undefined) {
    values.startDate = input.startDate;
  }
  if (input.endDate !== undefined) {
    values.endDate = input.endDate;
  }
  if (input.status !== undefined) {
    if (input.status !== existing.status) {
      const allowedTransitions: Record<string, string[]> = {
        draft: ["in_progress"],
        in_progress: ["draft", "completed"],
        completed: ["in_progress", "archived"]
      };
      const allowed = allowedTransitions[existing.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new AppError(409, `不允许从 ${existing.status} 转移到 ${input.status}`);
      }
    }
    values.status = input.status;
  }

  db.update(plans).set(values).where(eq(plans.id, id)).run();
  return getPlanById(id);
}

export function deletePlan(id: number) {
  const result = db.delete(plans).where(eq(plans.id, id)).run();
  if (result.changes === 0) {
    throw new AppError(404, "计划不存在");
  }
}

export function getPlanStats(planId: number) {
  const plan = db.select({ id: plans.id }).from(plans).where(eq(plans.id, planId)).get();
  assertOrThrow(plan, 404, "计划不存在");

  const rows = db
    .select({
      status: planCases.executionStatus,
      count: sql<number>`count(*)`
    })
    .from(planCases)
    .where(eq(planCases.planId, planId))
    .groupBy(planCases.executionStatus)
    .all();

  const stats = {
    total: 0,
    pending: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0
  };

  for (const row of rows) {
    const count = Number(row.count);
    stats.total += count;
    if (row.status === "pending") {
      stats.pending = count;
    }
    if (row.status === "passed") {
      stats.passed = count;
    }
    if (row.status === "failed") {
      stats.failed = count;
    }
    if (row.status === "blocked") {
      stats.blocked = count;
    }
    if (row.status === "skipped") {
      stats.skipped = count;
    }
  }

  return stats;
}
