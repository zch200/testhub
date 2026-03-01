import { z } from "zod";
import { buildPaginatedResponseSchema, dateSchema, isoDateTimeSchema, pageQuerySchema } from "./common";
import { planStatuses } from "./constants";

export const createPlanSchema = z.object({
  name: z.string().min(1, { message: "请填写计划名称" }).max(200, { message: "计划名称最多 200 个字符" }),
  description: z.string().max(2000, { message: "描述最多 2000 个字符" }).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: z.enum(planStatuses).default("draft")
});

export const updatePlanSchema = createPlanSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "至少需要填写一项"
});

export const planSchema = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: dateSchema.nullable(),
  endDate: dateSchema.nullable(),
  status: z.enum(planStatuses),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const planStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative()
});

export const planListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name", "startDate", "endDate"]).default("updatedAt"),
  status: z.enum(planStatuses).optional()
});

export const planListResponseSchema = buildPaginatedResponseSchema(planSchema);
