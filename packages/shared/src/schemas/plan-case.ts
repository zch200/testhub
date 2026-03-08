import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";
import { executionStatuses, historyReasonTypes, historySources } from "./constants";

export const createPlanCasesSchema = z.object({
  caseIds: z.array(z.number().int().positive()).min(1, { message: "请至少选择一个用例" })
});

export const addPlanCasesByDirectorySchema = z.object({
  directoryId: z.number().int().positive(),
  recursive: z.boolean().default(true)
});

export const updatePlanCaseSchema = z.object({
  executionStatus: z.enum(executionStatuses).optional(),
  remark: z.string().max(2000, { message: "备注最多 2000 个字符" }).optional(),
  reasonNote: z.string().max(500, { message: "原因说明最多 500 个字符" }).optional()
});

export const batchUpdatePlanCaseStatusSchema = z.object({
  planCaseIds: z.array(z.number().int().positive()).min(1, { message: "请至少选择一条计划用例" }),
  executionStatus: z.enum(executionStatuses),
  reasonNote: z.string().max(500, { message: "原因说明最多 500 个字符" }).optional()
});

export const planCaseSchema = z.object({
  id: z.number().int().positive(),
  planId: z.number().int().positive(),
  caseId: z.number().int().positive(),
  caseVersionId: z.number().int().positive(),
  executionStatus: z.enum(executionStatuses),
  remark: z.string().nullable(),
  executedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const planCaseListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "executionStatus"]).default("updatedAt"),
  status: z.enum(executionStatuses).optional()
});

export const planCaseStatusHistorySchema = z.object({
  id: z.number().int().positive(),
  planCaseId: z.number().int().positive(),
  planId: z.number().int().positive(),
  caseId: z.number().int().positive(),
  fromExecutionStatus: z.enum(executionStatuses).nullable(),
  toExecutionStatus: z.enum(executionStatuses),
  fromCaseVersionId: z.number().int().positive().nullable(),
  toCaseVersionId: z.number().int().positive().nullable(),
  reasonType: z.enum(historyReasonTypes),
  reasonNote: z.string().nullable(),
  actor: z.string(),
  source: z.enum(historySources),
  createdAt: isoDateTimeSchema
});

export const planCaseHistoryListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt")
});

export const planCaseListResponseSchema = buildPaginatedResponseSchema(planCaseSchema);
export const planCaseHistoryListResponseSchema = buildPaginatedResponseSchema(planCaseStatusHistorySchema);
