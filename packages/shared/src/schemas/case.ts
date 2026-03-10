import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";
import { caseContentTypes, casePriorities, caseTypes } from "./constants";

export const caseStepSchema = z.object({
  stepOrder: z.number().int().positive(),
  action: z.string().min(1, { message: "请填写步骤说明" }),
  expected: z.string().optional()
});

const caseBaseSchema = z.object({
  directoryId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1, { message: "请填写标题" }).max(300, { message: "标题最多 300 个字符" }),
  precondition: z.string().optional(),
  contentType: z.enum(caseContentTypes).default("text"),
  textContent: z.string().optional(),
  textExpected: z.string().optional(),
  priority: z.enum(casePriorities).default("P1"),
  caseType: z.enum(caseTypes).default("functional"),
  tags: z.array(z.string().min(1).max(64)).default([]),
  steps: z.array(caseStepSchema).default([])
});

export const createCaseSchema = caseBaseSchema.superRefine((value, ctx) => {
  if (value.contentType === "text" && !value.textContent) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "文本类型用例须填写正文内容" });
  }

  if (value.contentType === "step" && value.steps.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "步骤类型用例须至少添加一步" });
  }
});

export const updateCaseSchema = caseBaseSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "至少需要填写一项"
});

export const batchCreateCaseSchema = z.object({
  cases: z.array(createCaseSchema).min(1, { message: "请至少添加一条用例" })
});

export const caseSchema = z.object({
  id: z.number().int().positive(),
  libraryId: z.number().int().positive(),
  directoryId: z.number().int().positive().nullable(),
  latestVersionNo: z.number().int().positive(),
  title: z.string(),
  precondition: z.string().nullable(),
  contentType: z.enum(caseContentTypes),
  textContent: z.string().nullable(),
  textExpected: z.string().nullable(),
  priority: z.enum(casePriorities),
  caseType: z.enum(caseTypes),
  tags: z.array(z.string()),
  steps: z.array(caseStepSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const caseVersionSchema = z.object({
  id: z.number().int().positive(),
  caseId: z.number().int().positive(),
  versionNo: z.number().int().positive(),
  title: z.string(),
  precondition: z.string().nullable(),
  contentType: z.enum(caseContentTypes),
  textContent: z.string().nullable(),
  textExpected: z.string().nullable(),
  priority: z.enum(casePriorities),
  caseType: z.enum(caseTypes),
  tags: z.array(z.string()),
  steps: z.array(caseStepSchema),
  createdAt: isoDateTimeSchema
});

export const caseListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "title", "priority"]).default("updatedAt"),
  directoryId: z.coerce.number().int().positive().optional(),
  priority: z.enum(casePriorities).optional(),
  type: z.enum(caseTypes).optional(),
  tag: z.string().optional(),
  tagOp: z.enum(["and", "or"]).default("and"),
  keyword: z.string().optional()
});

export const batchUpdateCaseItemSchema = caseBaseSchema.partial().extend({
  id: z.number().int().positive()
});

export const batchUpdateCaseSchema = z.object({
  cases: z.array(batchUpdateCaseItemSchema).min(1, { message: "请至少选择一条用例" })
});

export const batchDeleteCaseSchema = z.object({
  caseIds: z.array(z.number().int().positive()).min(1, { message: "请至少选择一条用例" })
});

export const batchDeleteCaseResponseSchema = z.object({
  deleted: z.array(z.number().int().positive()),
  skipped: z.array(z.object({
    id: z.number().int().positive(),
    reason: z.string()
  }))
});

export const caseListResponseSchema = buildPaginatedResponseSchema(caseSchema);
export const caseVersionListResponseSchema = buildPaginatedResponseSchema(caseVersionSchema);
